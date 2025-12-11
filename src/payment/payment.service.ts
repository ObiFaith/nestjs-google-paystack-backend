import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { InitiatePaymentResponse, VerifyPaymentResponse } from '../interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {}

  /** Initiate a Paystack payment */
  async initiatePayment(userEmail: string, amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const amountInKobo = amount * 100;
    const paystackApiUrl = this.config.get<string>('paystack.apiUrl') as string;
    const paystackSecret = this.config.get<string>(
      'paystack.secretKey',
    ) as string;

    try {
      const { data }: { data: InitiatePaymentResponse } = await axios.post(
        `${paystackApiUrl}/initialize`,
        { email: userEmail, amount: amountInKobo },
        { headers: { Authorization: `Bearer ${paystackSecret}` } },
      );

      // Validate Paystack response
      if (!data || !data.status) {
        throw new HttpException(
          'Payment initiation failed by Paystack',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const { reference, authorization_url } = data.data;

      if (!reference || !authorization_url) {
        throw new HttpException(
          'Payment initiation incomplete',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      await this.paymentRepo.save(
        this.paymentRepo.create({
          reference,
          email: userEmail,
          amount,
          status: 'pending',
        }),
      );

      return { reference, authorization_url };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          'Payment initiation failed',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      console.error('Payment initiation error:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /** Verify payment from paystack */
  async verifyPayment(reference: string) {
    const paystackApiUrl = this.config.get<string>('paystack.apiUrl') as string;
    const paystackSecret = this.config.get<string>(
      'paystack.secretKey',
    ) as string;

    try {
      const {
        data: { data },
      }: {
        data: { data: VerifyPaymentResponse };
      } = await axios.get(`${paystackApiUrl}/verify/${reference}`, {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });

      const payment = await this.paymentRepo.findOne({
        where: { reference },
      });

      if (payment) {
        payment.status = data.status;
        payment.paid_at = data.paid_at;
        await this.paymentRepo.save(payment);
      }

      return {
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        paid_at: data.paid_at,
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }
}
