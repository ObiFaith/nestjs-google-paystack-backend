import {
  Type,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { Permission } from '../entities/api-key.entity';

export function ApiKeyGuardFactory(permission: Permission): Type<CanActivate> {
  @Injectable()
  class ApiKeyGuard implements CanActivate {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];

      if (!apiKey) throw new UnauthorizedException('API key is missing');

      const valid = await this.apiKeyService.validateApiKey(apiKey, permission);
      if (!valid)
        throw new UnauthorizedException(
          'Invalid API key or insufficient permission',
        );

      return true;
    }
  }

  return ApiKeyGuard;
}
