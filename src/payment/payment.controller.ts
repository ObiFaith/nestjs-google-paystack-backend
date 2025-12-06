import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { PaystackService } from './payment.service';

@Controller('payments/paystack')
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  /** Initiate payment */
  @Post('initiate')
  async initiate(@Body() body: { amount: number }, @Req() req) {
    const userEmail = req.user.email;
    const { amount } = body;
    return this.paystackService.initiateTransaction(userEmail, amount);
  }

  /** Webhook endpoint */
  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paystackService.handleWebhook(body, signature);
  }

  /** Check transaction status */
  @Get(':reference/status')
  async status(
    @Param('reference') reference: string,
    @Query('refresh') refresh?: boolean,
  ) {
    if (refresh === 'true') {
      return this.paystackService.verifyTransaction(reference);
    }
    return this.paystackService.verifyTransaction(reference);
  }
}
