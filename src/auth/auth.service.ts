import axios from 'axios';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleUserInfoResponse, TokenResponse } from './interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private readonly userService: UserService,
  ) {}

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
      const { user, isNewUser } = await this.userService.findOrCreateGoogleUser(
        {
          sub,
          email,
          name,
          picture,
          email_verified,
        },
      );
      return { user, isNewUser };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new UnauthorizedException('Invalid Google code');
      }
      console.error('Service Google callback error:', error);
      throw new InternalServerErrorException('Failed to process Google login');
    }
  }
}
