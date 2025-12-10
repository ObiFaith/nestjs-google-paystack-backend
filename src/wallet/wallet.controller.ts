import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
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
import { ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { ApiKeyGuardFactory } from 'src/api-key/guard';
import { DepositDto, PaystackWebhookDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApiKeyService } from '../api-key/api-key.service';
import { Permission } from '../api-key/entities/api-key.entity';
import { ReadAuthGuard } from 'src/api-key/guard/read-auth.guard';

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

  // @Post('paystack/webhook')
  // @HttpCode(HttpStatus.OK)
  // @WalletWebhookSwagger()
  // async webhook(
  //   @Body() body: PaystackWebhookDto,
  //   @Headers('x-paystack-signature') sig: string,
  // ) {
  //   const data = await this.walletService.handleWebhook(body, sig);

  //   return {
  //     status: HttpStatus.OK,
  //     message: 'Webhook processed',
  //     data,
  //   };
  // }

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
    @Body() body: { wallet_number: string; amount: number },
  ) {
    const data = await this.walletService.transfer(
      req.user,
      body.wallet_number,
      body.amount,
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
