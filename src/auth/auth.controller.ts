import {
  Get,
  Controller,
  HttpStatus,
  HttpCode,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
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
  @HttpCode(HttpStatus.OK)
  async googleCallback(@Query() query: _interface.CallbackQuery) {
    if (!query.code) {
      throw new BadRequestException('Missing code');
    }

    try {
      const { user, isNewUser } = await this.authService.googleCallback(
        query.code,
      );
      return { message: 'User created sucessfully!', ...user, isNewUser };
    } catch (error) {
      console.error('Google Callback error:', error);

      // Handle known NestJS exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Catch-all for unexpected errors
      throw new InternalServerErrorException('Google provider error');
    }
  }
}
