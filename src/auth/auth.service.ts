import axios from 'axios';
import { BadRequestException, Injectable } from '@nestjs/common';
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
    const apiUrl = this.config.get<string>('google.apiUrl');
    if (!apiUrl) throw new Error('Missing Google token url');

    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) throw new Error('Missing Google client ID');

    const redirectUri = this.config.get<string>('google.redirectUri');
    if (!redirectUri) throw new Error('Missing Google redirect URI');

    const clientSecret = this.config.get<string>('google.clientSecret');
    if (!clientSecret) throw new Error('Missing Google client secret');

    // Prepare form data
    const body = new URLSearchParams();

    body.append('code', code);
    body.append('client_id', clientId);
    body.append('redirect_uri', redirectUri);
    body.append('client_secret', clientSecret);
    body.append('grant_type', 'authorization_code');

    try {
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
      const { user, isNewUser } = await this.userService.findOrCreateGoogleUser(
        {
          sub,
          email,
          name,
          picture,
          email_verified,
        },
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid Google Id Token');
    }
  }
}
