import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import * as _interface from 'src/interface';
import { ApiKeyService } from './api-key.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateApiKeyDto, RolloverApiKeyDto } from './dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ApiKeyCreateSwagger, ApiKeyRolloverSwagger } from './doc/api-key.swagger';

@ApiTags('Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiKeyCreateSwagger()
  create(
    @Req() req: _interface.AuthRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.create(createApiKeyDto, req.user);
  }

  @Post('rollover')
  @HttpCode(HttpStatus.CREATED)
  @ApiKeyRolloverSwagger()
  rollover(@Body() dto: RolloverApiKeyDto) {
    return this.apiKeyService.rollover(dto);
  }
}
