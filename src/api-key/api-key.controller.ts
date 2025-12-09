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
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as _interface from 'src/interface';

@ApiTags('Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('/create')
  create(@Req() req: _interface.AuthRequest, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeyService.create(createApiKeyDto, req.user);
  }

  @Get()
  findAll() {
    return this.apiKeyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeyService.update(+id, updateApiKeyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiKeyService.remove(+id);
  }
}
