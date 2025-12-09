import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../entities/api-key.entity';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name of the API key',
    example: 'wallet-service',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'List of permissions for the API key',
    example: ['deposit', 'transfer', 'read'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];

  @ApiProperty({
    description:
      'Expiry of the API key: 1H=1 Hour, 1D=1 Day, 1M=1 Month, 1Y=1 Year',
    example: '1D',
  })
  @IsString()
  @Matches(/^(1H|1D|1M|1Y)$/, {
    message: 'expiry must be one of 1H, 1D, 1M, 1Y',
  })
  expiry: string;
}
