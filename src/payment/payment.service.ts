import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { Repository, Transaction } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaystackService {
  private readonly paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  private readonly webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  /** Initiate a Paystack transaction */
  async initiateTransaction(userEmail: string, amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    try {
      const { data } = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email: userEmail, amount },
        { headers: { Authorization: `Bearer ${this.paystackSecret}` } },
      );

      console.log('paystack', data);

      const { reference, authorization_url } = data.data;

      const transaction = this.transactionRepo.create({
        reference,
        email: userEmail,
        amount,
        status: 'pending',
      });
      await this.transactionRepo.save(transaction);

      return { reference, authorization_url };
    } catch (error) {
      throw new InternalServerErrorException('Payment initiation failed');
    }
  }

  /** Verify transaction from Paystack */
  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${this.paystackSecret}` } },
      );

      const data = response.data.data;
      const transaction = await this.transactionRepo.findOne({
        where: { reference },
      });
      if (transaction) {
        transaction.status = data.status;
        transaction.paidAt = new Date(data.paid_at);
        await this.transactionRepo.save(transaction);
      }

      return {
        reference: data.reference,
        status: data.status,
        amount: data.amount,
        paidAt: data.paid_at,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to verify transaction');
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

    const transaction = await this.transactionRepo.findOne({
      where: { reference: data.reference },
    });
    if (!transaction) return { status: true };

    if (event === 'charge.success') transaction.status = 'success';
    else if (event === 'charge.failed') transaction.status = 'failed';
    else transaction.status = 'pending';

    transaction.paidAt = data.paid_at
      ? new Date(data.paid_at)
      : transaction.paidAt;
    await this.transactionRepo.save(transaction);

    return { status: true };
  }
}
