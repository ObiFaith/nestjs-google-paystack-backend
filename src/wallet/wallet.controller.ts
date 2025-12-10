import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  WalletStatusSwagger,
  WalletBalanceSwagger,
  WalletDepositSwagger,
  WalletWebhookSwagger,
  WalletTransferSwagger,
  WalletTransactionsSwagger,
} from './doc/wallet.swagger';
import { DepositDto, TransferDto } from './dto';
import * as _interface from '../interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Permission } from '../api-key/entities/api-key.entity';
import { ApiKeyGuardFactory, ReadAuthGuard } from '../api-key/guard';

@Controller('wallet')
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @WalletDepositSwagger()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory(Permission.DEPOSIT))
  async deposit(@Body() body: DepositDto, @Req() req: _interface.AuthRequest) {
    const data = await this.walletService.deposit(req.user, body.amount);

    return {
      status: HttpStatus.CREATED,
      message: 'Deposit initialized',
      data,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@Req() req: _interface.AuthRequest) {
    const wallet = await this.walletService.getUserWallet(req.user.id);

    return {
      balance: wallet.balance,
      wallet_number: wallet.wallet_number,
      created_at: wallet.created_at,
    };
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  @WalletWebhookSwagger()
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    await this.walletService.handlePaystackWebhook(rawBody, signature);

    return { status: true };
  }

  @Get('deposit/:reference/status')
  @WalletStatusSwagger()
  @HttpCode(HttpStatus.OK)
  @UseGuards(ReadAuthGuard)
  async getStatus(@Param('reference') ref: string) {
    const data = await this.walletService.checkStatus(ref);

    return {
      status: HttpStatus.OK,
      message: 'Transaction status retrieved',
      data,
    };
  }

  @Get('balance')
  @WalletBalanceSwagger()
  @UseGuards(ReadAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async getBalance(@Req() req: _interface.AuthRequest) {
    const data = await this.walletService.getBalance(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Wallet balance retrieved',
      data,
    };
  }

  @Post('transfer')
  @WalletTransferSwagger()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, ApiKeyGuardFactory(Permission.TRANSFER))
  async transfer(
    @Req() req: _interface.AuthRequest,
    @Body() transferDto: TransferDto,
  ) {
    const data = await this.walletService.transfer(
      req.user,
      transferDto.wallet_number,
      transferDto.amount,
    );

    return {
      status: HttpStatus.CREATED,
      message: 'Transfer successful',
      data,
    };
  }

  @Get('transactions')
  @UseGuards(ReadAuthGuard)
  @WalletTransactionsSwagger()
  @HttpCode(HttpStatus.CREATED)
  async transactions(@Req() req: _interface.AuthRequest) {
    const data = await this.walletService.history(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Transaction history fetched',
      data,
    };
  }
}
