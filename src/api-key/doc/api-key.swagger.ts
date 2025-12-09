import { CreateApiKeyDto, RolloverApiKeyDto } from '../dto';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export const ApiKeyCreateSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new API key for service access' }),
    ApiBody({ type: CreateApiKeyDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Successfully created a new API key',
      schema: {
        example: {
          api_key: 'sk_live_xxxxx',
          expires_at: '2025-01-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Unable to create API key. Possible reasons: max keys exceeded, invalid permissions, missing permissions, invalid expiry',
    }),
  );

export const ApiKeyRolloverSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rollover an expired API key into a new one' }),
    ApiBody({ type: RolloverApiKeyDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Successfully rolled over the API key',
      schema: {
        example: {
          api_key: 'sk_live_xxxxx',
          expires_at: '2025-02-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Unable to rollover API key. Possible reasons: key not expired, key not found, max keys exceeded, invalid expiry',
    }),
  );
