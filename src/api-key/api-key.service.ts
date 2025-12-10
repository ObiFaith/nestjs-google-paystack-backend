import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserReq } from '../interface';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import { ApiKey, Permission } from './entities/api-key.entity';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Create a new API key for a user
   * @param user - the user creating the key
   * @param dto - CreateApiKeyDto from controller
   * @returns raw API key and expiry
   */
  async create(dto: CreateApiKeyDto, user: UserReq) {
    // Check number of active keys
    await this.checkActiveKeysLimit(user.id);

    // Permission validation
    const permissions = this.validatePermissions(dto.permissions);

    // Parse expiry string to Date
    const expiresAt = this.parseExpiry(dto.expiry);

    // Generate raw and hashed key with keyId
    const { rawKey, hashedKey, keyId } = await this.generateKeyWithId();

    // Create and save entity
    const apiKey = this.apiKeyRepository.create({
      user,
      name: dto.name,
      permissions,
      key: hashedKey,
      keyId,
      expiresAt,
      revoked: false,
    });

    await this.apiKeyRepository.save(apiKey);

    // Return raw key (shown only once) and expiry
    return {
      id: apiKey.id,
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    };
  }

  async rollover(dto: RolloverApiKeyDto, user: UserReq) {
    // Find expired key
    const expiredKey = await this.apiKeyRepository.findOne({
      where: { id: dto.expiredKeyId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!expiredKey)
      throw new NotFoundException(
        'Expired API key not found or does not belong to the user',
      );

    if (expiredKey.expiresAt.getTime() > Date.now())
      throw new BadRequestException('API key has not expired yet');

    // Key must NOT have produced a rollover already
    const alreadyRolled = await this.apiKeyRepository.findOne({
      where: { rolledFromId: expiredKey.id },
    });

    if (alreadyRolled)
      throw new BadRequestException('This key has already been rolled over');

    // Revoke old key
    expiredKey.revoked = true;
    await this.apiKeyRepository.save(expiredKey);

    // Check active key limit
    await this.checkActiveKeysLimit(user.id);

    // Parse new expiry
    const expiresAt = this.parseExpiry(dto.expiry);

    // Generate raw and hashed key with keyId
    const { rawKey, hashedKey, keyId } = await this.generateKeyWithId();

    // Save new API key with same permissions
    const newApiKey = this.apiKeyRepository.create({
      user: expiredKey.user,
      name: expiredKey.name,
      permissions: expiredKey.permissions,
      key: hashedKey,
      keyId,
      expiresAt,
      revoked: false,
      rolledFromId: expiredKey.id,
    });

    await this.apiKeyRepository.save(newApiKey);

    return {
      id: newApiKey.id,
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Check if the user has exceeded max active API keys
   */
  private async checkActiveKeysLimit(userId: string) {
    const activeKeysCount = await this.apiKeyRepository.count({
      where: {
        user: { id: userId },
        revoked: false,
        expiresAt: MoreThan(new Date(Date.now())),
      },
    });

    if (activeKeysCount >= 5) {
      throw new BadRequestException(
        'Maximum of 5 active API keys allowed per user',
      );
    }
  }

  /**
   * Generate raw API key, hashed key, and indexable keyId
   */
  private async generateKeyWithId(): Promise<{
    rawKey: string;
    hashedKey: string;
    keyId: string;
  }> {
    const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(rawKey, 10);
    const keyId = crypto.randomBytes(16).toString('hex');
    return { rawKey, hashedKey, keyId };
  }

  /**
   * Convert expiry string to actual Date
   * Supports: 1H, 1D, 1M, 1Y
   */
  private parseExpiry(expiry: string): Date {
    const now = Date.now();
    let msToAdd = 0;

    switch (expiry) {
      case '1H':
        msToAdd = 1 * 60 * 60 * 1000;
        break;
      case '1D':
        msToAdd = 24 * 60 * 60 * 1000;
        break;
      case '1M':
        msToAdd = 30 * 24 * 60 * 60 * 1000;
        break;
      case '1Y':
        msToAdd = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new BadRequestException('Invalid expiry format');
    }

    return new Date(now + msToAdd);
  }

  /**
   * Validate a raw API key and optional permission
   * @param rawKey - raw API key from request header
   * @param requiredPermission - optional permission to check (e.g., 'deposit')
   * @returns ApiKey entity if valid
   */
  async validateApiKey(
    rawKey: string,
    requiredPermission?: Permission,
  ): Promise<ApiKey> {
    const keyId = rawKey.slice(-32);
    const key = await this.apiKeyRepository.findOne({
      where: { keyId, revoked: false },
    });

    if (!key) throw new ForbiddenException('Invalid API key');
    if (key.expiresAt.getTime() < Date.now())
      throw new ForbiddenException('API key expired');

    const match = await bcrypt.compare(rawKey, key.key);
    if (!match) throw new ForbiddenException('Invalid API key');

    if (requiredPermission && !key.permissions.includes(requiredPermission))
      throw new ForbiddenException(
        `API key lacks required permission: ${requiredPermission}`,
      );

    return key;
  }

  /**
   * Validate and parse permissions array
   * @param permissions - permissions array from DTO
   * @returns validated permissions
   */
  private validatePermissions(permissions: string[]): Permission[] {
    if (!permissions || permissions.length === 0) {
      throw new BadRequestException(
        `API key must have at least one permission. Available permissions: ${Object.values(Permission).join(', ')}`,
      );
    }

    const invalidPermissions = permissions.filter(
      (p) => !Object.values(Permission).includes(p as Permission),
    );
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permission(s): ${invalidPermissions.join(', ')}. Available permissions: ${Object.values(Permission).join(', ')}`,
      );
    }

    return permissions as Permission[];
  }
}
