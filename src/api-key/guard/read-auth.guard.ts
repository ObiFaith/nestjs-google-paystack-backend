import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiKeyService } from '../api-key.service';
import { Permission } from '../entities/api-key.entity';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Injectable()
export class ReadAuthGuard implements CanActivate {
  private readonly jwtAuthGuard = new JwtAuthGuard();
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (apiKey) {
      // Validate API key for READ permission
      const valid = await this.apiKeyService.validateApiKey(
        apiKey,
        Permission.READ,
      );
      if (!valid) throw new UnauthorizedException('Invalid API key');

      // Mark the request as coming from API key
      request.apiKey = apiKey;

      return true;
    }

    // Fallback to JWT auth
    const result = this.jwtAuthGuard.canActivate(context);
    if (result instanceof Observable) {
      return firstValueFrom(result);
    }
    return result;
  }
}
