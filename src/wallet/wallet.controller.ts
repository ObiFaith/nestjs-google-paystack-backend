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
import * as _interface from '../interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  WalletStatusSwagger,
  WalletBalanceSwagger,
  WalletDepositSwagger,
  WalletWebhookSwagger,
  WalletTransferSwagger,
  WalletTransactionsSwagger,
} from './doc/wallet.swagger';
import { DepositDto, PaystackWebhookDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApiKeyService } from '../api-key/api-key.service';
import { Permission } from '../api-key/entities/api-key.entity';

@Controller('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private apiKeyService: ApiKeyService,
    private walletService: WalletService,
  ) {}

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @WalletDepositSwagger()
  async deposit(
    @Body() body: DepositDto,
    @Req() req: _interface.AuthRequest,
    @Headers('x-api-key') apiKey: string,
  ) {
    // Validate API key and deposit permission
    await this.apiKeyService.validateApiKey(apiKey, Permission.DEPOSIT);
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
  async getBalance(@Req() req: _interface.AuthRequest) {
    const data = await this.walletService.getBalance(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Wallet balance retrieved',
      data,
    };
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  @WalletTransferSwagger()
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
  @WalletTransactionsSwagger()
  async transactions(@Req() req: _interface.AuthRequest) {
    const data = await this.walletService.history(req.user);

    return {
      status: HttpStatus.OK,
      message: 'Transaction history fetched',
      data,
    };
  }
}
