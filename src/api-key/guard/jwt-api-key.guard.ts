import {
  Type,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { UserService } from 'src/user/user.service';
import { Permission } from '../entities/api-key.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

export function JwtOrApiKeyGuardFactory(
  permission?: Permission,
): Type<CanActivate> {
  @Injectable()
  class JwtOrApiKeyGuard implements CanActivate {
    constructor(
      private readonly apiKeyService: ApiKeyService,
      private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      // Try JWT first
      try {
        const jwtGuard = new JwtAuthGuard();
        const result = await jwtGuard.canActivate(context);
        if (result) return true;
      } catch (e) {
        // JWT failed; try API key
      }

      // Try API key
      const request = context.switchToHttp().getRequest();
      const apiKey =
        request.headers['x-api-key'] || request.headers['X-Api-Key'];

      if (!apiKey) {
        throw new UnauthorizedException(
          'Authentication required: provide either JWT token or API key',
        );
      }

      // This will throw if invalid or missing permission
      const key = await this.apiKeyService.validateApiKey(apiKey, permission);

      // Fetch the user associated with this API key
      const user = await this.userService.findByUserId(key.user_id);
      if (!user) throw new UnauthorizedException('User not found');

      // Attach to request
      request.user = {
        id: user.id,
        email: user.email,
      };

      return true;
    }
  }
  return JwtOrApiKeyGuard;
}
