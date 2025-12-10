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
} from '@nestjs/common';
import {
  WalletStatusSwagger,
  WalletBalanceSwagger,
  WalletDepositSwagger,
  WalletWebhookSwagger,
  WalletTransferSwagger,
  WalletTransactionsSwagger,
} from './doc/wallet.swagger';
import { DepositDto } from './dto';
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

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  @WalletWebhookSwagger()
  async webhook(@Req() req) {
    try {
      // Capture raw body
      const body = req.rawBody
        ? req.rawBody.toString()
        : JSON.stringify(req.body);
      console.log('Webhook received: body =', body);

      // Capture headers
      const signature = req.headers['x-paystack-signature'] as string;
      console.log('Webhook received: x-paystack-signature =', signature);

      const data = await this.walletService.handleWebhook(body, signature);

      console.log(
        'Webhook processed successfully for reference:',
        data?.reference ?? 'N/A',
      );

      return {
        status: HttpStatus.OK,
        message: 'Webhook processed',
        data,
      };
    } catch (error) {
      console.error('Webhook error:', error);
      return { status: false, message: 'Webhook failed' };
    }
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
