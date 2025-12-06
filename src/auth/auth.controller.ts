import {
  Get,
  Controller,
  HttpStatus,
  HttpCode,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import express from 'express';
import * as _interface from './interface';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @HttpCode(HttpStatus.OK)
  googleSignIn(
    @Query('response_type') responseType: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    try {
      const googleAuthUrl = this.authService.googleOauth();

      // Basic validation
      if (!googleAuthUrl || typeof googleAuthUrl !== 'string')
        throw new InternalServerErrorException(
          'Failed to generate Google Oauth URL',
        );

      // Allow json response type
      if (responseType && responseType !== 'json') {
        throw new BadRequestException(
          "Invalid response_type. Allowed 'json' only",
        );
      }

      // Response mode: JSON
      if (responseType === 'json') {
        return { google_auth_url: googleAuthUrl };
      }

      // Default: redirect
      return res.redirect(googleAuthUrl);
    } catch (error) {
      console.error('Google OAuth error:', error);

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        'Unable to initialize Google login flow.',
      );
    }
  }

  @Get('google/callback')
  async googleCallback(@Query() query: _interface.CallbackQuery) {
    try {
      return this.authService.googleCallback(query.code);
    } catch (error) {
      console.error('Google Callback error:', error);
    }
  }
}
