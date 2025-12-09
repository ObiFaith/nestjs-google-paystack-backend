import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserReq } from 'src/interface';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKey, Permission } from './entities/api-key.entity';
import { Injectable, BadRequestException } from '@nestjs/common';

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
    const activeKeysCount = await this.apiKeyRepository.count({
      where: {
        user: { id: user.id },
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new BadRequestException(
        'Maximum of 5 active API keys allowed per user',
      );
    }

    // Permission validation
    if (!dto.permissions || dto.permissions.length === 0) {
      throw new BadRequestException(
        `API key must have at least one permission. Available permissions: ${Object.values(Permission).join(', ')}`,
      );
    }

    // Check for invalid permission
    const invalidPermissions = dto.permissions.filter(
      (p) => !Object.values(Permission).includes(p),
    );
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permission(s): ${invalidPermissions.join(', ')}. Available permissions: ${Object.values(Permission).join(', ')}`,
      );
    }

    // Parse expiry string to Date
    const expiresAt = this.parseExpiry(dto.expiry);

    // Generate raw API key (secure random string)
    const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');

    // Hash key before saving
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Create and save entity
    const apiKey = this.apiKeyRepository.create({
      user,
      name: dto.name,
      permissions: dto.permissions,
      key: hashedKey,
      expiresAt,
      revoked: false,
    });

    await this.apiKeyRepository.save(apiKey);

    // Return raw key (shown only once) and expiry
    return {
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Convert expiry string to actual Date
   * Supports: 1H, 1D, 1M, 1Y
   */
  private parseExpiry(expiry: string): Date {
    const now = new Date();
    const date = new Date(now);

    switch (expiry) {
      case '1H':
        date.setHours(date.getHours() + 1);
        break;
      case '1D':
        date.setDate(date.getDate() + 1);
        break;
      case '1M':
        date.setMonth(date.getMonth() + 1);
        break;
      case '1Y':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException(
          'Invalid expire. Must be one of 1H, 1D, 1M, 1Y',
        );
    }

    return date;
  }

  findAll() {
    return `This action returns all apiKey`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiKey`;
  }

  update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
    return `This action updates a #${id} apiKey`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiKey`;
  }
}
