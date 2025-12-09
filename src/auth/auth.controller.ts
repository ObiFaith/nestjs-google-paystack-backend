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
  Body,
  Post,
} from '@nestjs/common';
import express from 'express';
import { LoginDto, SignupDto } from './dto';
import * as _interface from '../interface';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created a new user account',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Unable to register with provided credentials',
  })
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto) {
    const data = await this.authService.signup(dto);

    return {
      status: HttpStatus.CREATED,
      message: 'User created sucessfully!',
      data,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in, returns JWT token and user info',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);

    return {
      status: HttpStatus.OK,
      message: 'Login sucessful!',
      data,
    };
  }

  @Get('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redirect to Google OAuth login page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Google OAuth URL when response_type=json',
  })
  @ApiQuery({
    name: 'response_type',
    required: false,
    description: 'Response type for OAuth',
  })
  googleSignIn(
    @Res({ passthrough: true }) res: express.Response,
    @Query('response_type') responseType?: string,
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
        return {
          status: HttpStatus.OK,
          message: 'Google OAuth URL generated successfully!',
          google_auth_url: googleAuthUrl,
        };
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
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Handles Google OAuth callback and returns user info + JWT',
  })
  async googleCallback(@Query() query: _interface.CallbackQuery) {
    if (!query.code) {
      throw new BadRequestException('Missing code');
    }

    try {
      const data = await this.authService.googleCallback(query.code);

      return {
        status: HttpStatus.OK,
        message: 'User created sucessfully!',
        data,
      };
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
