import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { UserReq } from '../interface';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Wallet, WalletTransaction } from './entities';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,

    @InjectRepository(WalletTransaction)
    private txRepo: Repository<WalletTransaction>,

    private paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get or create user wallet
   * @param user - User entity
   */
  async getOrCreateWallet(user: User) {
    let wallet = await this.walletRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({ user, balance: 0 });
      wallet = await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  /** Wallet Deposit
   * @param user - User entity
   * @param amount - Amount to deposit
   */
  async deposit(user: UserReq, amount: number) {
    if (!amount || amount < 100)
      throw new BadRequestException('Amount invalid');

    const wallet = await this.getUserWallet(user.id);
    const init = await this.paymentService.initiatePayment(user.email, amount);

    // Save pending transaction
    const tx = this.txRepo.create({
      wallet,
      amount,
      reference: init.reference,
      type: 'deposit',
      status: 'pending',
    });

    await this.txRepo.save(tx);

    return init;
  }

  /** Paystack Webhook */
  async handleWebhook(rawPayload: string, signature: string) {
    console.log('handleWebhook called');

    if (!(await this.verifySignature(rawPayload, signature))) {
      console.warn('Invalid signature detected');
      throw new ForbiddenException('Invalid signature');
    }

    const { data } = JSON.parse(rawPayload);
    const reference = data.reference;
    console.log('Webhook event reference:', reference, 'status:', data.status);

    const tx = await this.txRepo.findOne({
      where: { reference },
      relations: ['wallet'],
    });

    if (!tx) {
      this.logger.warn(`Transaction not found for reference: ${reference}`);
      return { status: true };
    }

    if (tx.status === 'success') {
      console.log(`Transaction ${reference} already processed`);
      return { status: true };
    }

    try {
      if (data.status === 'success') {
        const amount = data.amount / 100; // convert kobo → Naira
        console.log(`Crediting wallet for tx ${reference}, amount: ${amount}`);

        tx.wallet.balance += amount;
        tx.status = 'success';

        await this.walletRepo.save(tx.wallet);
        await this.txRepo.save(tx);

        console.log(`Wallet credited successfully for tx ${reference}`);
      } else if (data.status === 'failed') {
        console.log(`Marking transaction ${reference} as failed`);
        tx.status = 'failed';
        await this.txRepo.save(tx);
      }

      return { status: true, reference };
    } catch (err) {
      console.error(`Error processing transaction ${reference}:`, err);
      throw err;
    }
  }

  /** Manual Status Check */
  async checkStatus(reference: string) {
    const tx = await this.txRepo.findOne({ where: { reference } });

    if (!tx) throw new NotFoundException('Transaction not found');

    return {
      reference: tx.reference,
      status: tx.status,
      amount: tx.amount,
    };
  }

  /** Get User Wallet
   * @param userId - User Id
   */
  async getUserWallet(userId: string) {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  /** Get Wallet Balance
   * @param user - User entity
   */
  async getBalance(user: UserReq) {
    const wallet = await this.getUserWallet(user.id);
    return { balance: wallet.balance };
  }

  /** Wallet Transfer */
  async transfer(user: UserReq, walletNumber: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const sender = await this.walletRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!sender) throw new NotFoundException('Sender not found');

    const receiver = await this.walletRepo.findOne({
      where: { id: walletNumber },
    });

    if (!receiver) throw new NotFoundException('Receiver not found');
    if (sender.balance < amount)
      throw new BadRequestException('Insufficient balance');

    sender.balance -= amount;
    receiver.balance += amount;

    await this.walletRepo.save([sender, receiver]);

    await this.txRepo.save([
      this.txRepo.create({
        wallet: sender,
        type: 'transfer',
        amount,
        status: 'success',
        reference: 'tx-' + Date.now(),
      }),
      this.txRepo.create({
        wallet: receiver,
        type: 'deposit',
        amount,
        status: 'success',
        reference: 'tx-' + Date.now(),
      }),
    ]);

    return {
      status: 'success',
      message: 'Transfer completed',
    };
  }

  /** History
   * @param user - User entity
   */
  async history(user: UserReq) {
    return this.txRepo.find({
      where: { wallet: { user: { id: user.id } } },
    });
  }

  private async verifySignature(payload: string, signature: string) {
    const paystackSecret = this.config.get('paystack.secretKey') as string;
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(payload)
      .digest('hex');

    const valid = hash === signature;
    console.log('Signature verification:', valid ? 'passed' : 'failed');
    return valid;
  }
}
