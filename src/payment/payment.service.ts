import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  private readonly paymentSecret = process.env.PAYSTACK_SECRET_KEY;
  private readonly webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  /** Initiate a Paystack payment */
  async initiatePayment(userEmail: string, amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    try {
      const { data } = await axios.post(
        'https://api.payment.co/payment/initialize',
        { email: userEmail, amount },
        { headers: { Authorization: `Bearer ${this.paymentSecret}` } },
      );

      const { reference, authorization_url } = data.data;

      const payment = this.paymentRepo.create({
        reference,
        email: userEmail,
        amount,
        status: 'pending',
      });
      await this.paymentRepo.save(payment);

      return { reference, authorization_url };
    } catch (error) {
      throw new InternalServerErrorException('Payment initiation failed');
    }
  }

  /** Verify payment from Payment */
  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `https://api.payment.co/payment/verify/${reference}`,
        { headers: { Authorization: `Bearer ${this.paymentSecret}` } },
      );

      const data = response.data.data;
      const payment = await this.paymentRepo.findOne({
        where: { reference },
      });
      if (payment) {
        payment.status = data.status;
        payment.paidAt = new Date(data.paid_at);
        await this.paymentRepo.save(payment);
      }

      return {
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        paidAt: data.paid_at,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  /** Handle webhook events */
  async handleWebhook(payload: any, signature: string) {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    const event = payload.event;
    const data = payload.data;

    const payment = await this.paymentRepo.findOne({
      where: { reference: data.reference },
    });
    if (!payment) return { status: true };

    if (event === 'charge.success') payment.status = 'success';
    else if (event === 'charge.failed') payment.status = 'failed';
    else payment.status = 'pending';

    payment.paidAt = data.paid_at ? new Date(data.paid_at) : payment.paidAt;
    await this.paymentRepo.save(payment);

    return { status: true };
  }
}
