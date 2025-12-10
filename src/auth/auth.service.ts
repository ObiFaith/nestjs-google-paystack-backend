import axios from 'axios';
import {
  UserReq,
  UserResponse,
  TokenResponse,
  GoogleUserInfoResponse,
} from '../interface';
import {
  Logger,
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, SignupDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  generateJwtToken(user: UserReq) {
    return this.jwtService.sign({
      id: user.id,
      email: user.email,
    });
  }

  async signup(dto: SignupDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(
        'Unable to register with provided credentials',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.createUser({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
    });

    const accessToken = this.generateJwtToken(user);

    await this.walletService.getOrCreateWallet(user);
    return this.mapUserResponse(user, accessToken);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateJwtToken(user);
    return this.mapUserResponse(user, accessToken);
  }

  googleOauth() {
    const scope = encodeURIComponent('openid email profile');
    const clientId = this.config.get<string>('google.clientId');
    const oauthUrl = this.config.get<string>('google.oauthUrl');
    const redirectUri = this.config.get<string>('google.redirectUri');

    return `${oauthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&prompt=consent&scope=${scope}`;
  }

  async googleCallback(code: string) {
    const apiUrl = this.config.get('google.apiUrl') as string;
    const clientId = this.config.get('google.clientId') as string;
    const redirectUri = this.config.get('google.redirectUri') as string;
    const clientSecret = this.config.get('google.clientSecret') as string;

    // Prepare form data
    const body = new URLSearchParams();
    body.append('code', code);
    body.append('client_id', clientId);
    body.append('redirect_uri', redirectUri);
    body.append('client_secret', clientSecret);
    body.append('grant_type', 'authorization_code');

    try {
      // Exchange code for token
      const { data: token }: { data: TokenResponse } = await axios.post(
        `${apiUrl}/token`,
        body.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      // verify google token
      const {
        data: { sub, email, name, picture, email_verified },
      }: { data: GoogleUserInfoResponse } = await axios.get(
        `${apiUrl}/tokeninfo?id_token=${token.id_token}`,
      );

      if (!email_verified) {
        throw new UnauthorizedException('Google email not verified');
      }

      // Get user info
      const { user } = await this.userService.findOrCreateGoogleUser({
        sub,
        email,
        name,
        picture,
        email_verified,
      });
      // Create JWT
      const accessToken = this.generateJwtToken(user);

      await this.walletService.getOrCreateWallet(user);
      return this.mapUserResponse(user, accessToken);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new UnauthorizedException('Invalid Google code');
      }
      console.error('Service Google callback error:', error);
      throw new InternalServerErrorException('Failed to process Google login');
    }
  }

  mapUserResponse(user: Partial<UserResponse>, accessToken: string) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? null,
      google_id: user.google_id ?? null,
      email_verified: user.email_verified ?? false,
      access_token: accessToken,
    };
  }
}
