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
import {
  WalletStatusSwagger,
  WalletBalanceSwagger,
  WalletDepositSwagger,
  WalletWebhookSwagger,
  WalletTransferSwagger,
  WalletTransactionsSwagger,
} from './doc/wallet.swagger';
import * as _interface from '../interface';
import { DepositDto, TransferDto } from './dto';
import { WalletService } from './wallet.service';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtOrApiKeyGuardFactory } from '../api-key/guard';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { Permission } from '../api-key/entities/api-key.entity';

@Controller('wallet')
@ApiBearerAuth()
@ApiSecurity('API Key')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @WalletDepositSwagger()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.DEPOSIT))
  async deposit(@Body() body: DepositDto, @Req() req: _interface.AuthRequest) {
    const data = await this.walletService.deposit(req.user, body.amount);

    return {
      status: HttpStatus.CREATED,
      message: 'Deposit initialized',
      data,
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.READ))
  async getMyWallet(@Req() req: _interface.AuthRequest) {
    const wallet = await this.walletService.getUserWallet(req.user.id);

    return {
      status: HttpStatus.OK,
      message: 'Wallet retrieved successfully',
      data: {
        balance: wallet.balance,
        wallet_number: wallet.wallet_number,
        created_at: wallet.created_at,
      },
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

    const data = await this.walletService.handlePaystackWebhook(
      rawBody,
      signature,
    );

    return {
      status: HttpStatus.OK,
      message: 'Payment successful',
      data,
    };
  }

  @Get('deposit/:reference/status')
  @WalletStatusSwagger()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.READ))
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
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.READ))
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
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.TRANSFER))
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
  @WalletTransactionsSwagger()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtOrApiKeyGuardFactory(Permission.READ))
  async transactions(@Req() req: _interface.AuthRequest) {
    const data = await this.walletService.history(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Transaction history fetched',
      data,
    };
  }
}
