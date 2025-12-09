import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  Param,
  Get,
} from '@nestjs/common';
import * as _interface from '../interface';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Initiate payment */
  @Post('paystack/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a Paystack payment transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction initialized successfully',
  })
  @ApiBody({
    type: InitiatePaymentDto,
    description: 'Transaction initialized successfully',
  })
  async initiate(
    @Body() body: InitiatePaymentDto,
    @Req() req: _interface.AuthRequest,
  ) {
    const data = await this.paymentService.initiatePayment(
      req.user.email,
      body.amount,
    );

    return {
      status: HttpStatus.CREATED,
      message: 'Payment initiated successfully!',
      data,
    };
  }

  /** Check transaction status */
  @Get('paystack/:reference/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a Paystack payment by reference' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment verified successfully',
  })
  async status(@Param('reference') reference: string) {
    const data = await this.paymentService.verifyPayment(reference);

    return {
      status: HttpStatus.OK,
      message: 'Payment verified successfully',
      data,
    };
  }
}
