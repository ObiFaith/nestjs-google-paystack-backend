import {
  Req,
  Post,
  Body,
  HttpCode,
  UseGuards,
  HttpStatus,
  Controller,
} from '@nestjs/common';
import {
  ApiKeyCreateSwagger,
  ApiKeyRolloverSwagger,
} from './doc/api-key.swagger';
import * as _interface from '../interface';
import { ApiKeyService } from './api-key.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiKeyCreateSwagger()
  async create(
    @Req() req: _interface.AuthRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    const data = await this.apiKeyService.create(createApiKeyDto, req.user);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'API Key created successfully',
      data,
    };
  }

  @Post('rollover')
  @HttpCode(HttpStatus.CREATED)
  @ApiKeyRolloverSwagger()
  async rollover(
    @Body() dto: RolloverApiKeyDto,
    @Req() req: _interface.AuthRequest,
  ) {
    const data = await this.apiKeyService.rollover(dto, req.user);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'API Key rolled over successfully',
      data,
    };
  }
}
