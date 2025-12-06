import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as _interface from 'src/auth/interface';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Initiate payment */
  @Post('paystack/initiate')
  async initiate(
    @Body() body: { amount: number },
    @Req() req: _interface.AuthenticatedRequest,
  ) {
    console.log('user email', req.user.email);
    return this.paymentService.initiatePayment(req.user.email, body.amount);
  }

  /** Webhook endpoint */
  @Post('paystack/webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-payment-signature') signature: string,
  ) {
    return this.paymentService.handleWebhook(body, signature);
  }

  /** Check transaction status */
  @Get('aystack/:reference/status')
  async status(
    @Param('reference') reference: string,
    @Query('refresh') refresh?: boolean,
  ) {
    if (refresh === 'true') {
      return this.paymentService.verifyTransaction(reference);
    }
    return this.paymentService.verifyTransaction(reference);
  }
}
