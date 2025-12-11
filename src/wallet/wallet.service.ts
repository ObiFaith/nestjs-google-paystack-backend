import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { Payload, PayloadData, UserReq } from '../interface';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Wallet, WalletTransaction } from './entities';
import { PaymentService } from '../payment/payment.service';
import { Payment } from 'src/payment/entities/payment.entity';
import { WalletNumberHelper } from './helpers/wallet-number.helper';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,

    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,

    @InjectRepository(WalletTransaction)
    private walletTxRepo: Repository<WalletTransaction>,

    private paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  private async generateUniqueWalletNumber(): Promise<string> {
    while (true) {
      const wallet_number = WalletNumberHelper.generate();

      const exists = await this.walletRepo.findOne({
        where: { wallet_number },
      });

      if (!exists) return wallet_number;
    }
  }

  /**
   * Create user wallet
   * @param user - User entity
   */
  async createUserWallet(user: User) {
    const existingWallet = await this.walletRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (existingWallet) {
      const { wallet_number, balance } = existingWallet;
      return { wallet_number, balance };
    }

    const wallet_number = await this.generateUniqueWalletNumber();

    await this.walletRepo.save(
      this.walletRepo.create({
        balance: 0,
        user,
        wallet_number,
      }),
    );
    return { wallet_number, balance: 0 };
  }

  /** Wallet Deposit
   * @param user - User entity
   * @param amount - Amount to deposit
   */
  async deposit(user: UserReq, amount: number) {
    const wallet = await this.getUserWallet(user.id);
    const init = await this.paymentService.initiatePayment(user.email, amount);

    // Save pending transaction
    await this.walletTxRepo.save(
      this.walletTxRepo.create({
        wallet,
        amount,
        reference: init.reference,
        type: 'deposit',
        status: 'pending',
      }),
    );

    return { ...init, amount };
  }

  /** Paystack Webhook */
  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    if (!this.verifyPaystackSignature(rawBody, signature))
      throw new ForbiddenException('Invalid signature');

    const payload = JSON.parse(rawBody.toString('utf8')) as Payload;
    const { event, data } = payload;

    if (event !== 'charge.success') {
      this.logger.log(`Ignoring event: ${event}`);
      return { status: true };
    }
    //Process the payment
    await this.processSuccessfulCharge(data);
    return { status: true };
  }

  private async processSuccessfulCharge(data: PayloadData) {
    const reference = data.reference;
    const amountInNaira = data.amount / 100; // kobo to Naira

    await this.walletRepo.manager.transaction(async (manager) => {
      // Update Payment record
      const payment = await manager.findOne(Payment, {
        where: { reference },
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        this.logger.warn(`Payment not found: ${reference}`);
        return;
      }

      if (payment.status === 'success') {
        this.logger.log(`Payment already processed: ${reference}`);
        return;
      }

      payment.status = 'success';
      payment.paid_at = new Date();
      await manager.save(Payment, payment);

      // Update WalletTransaction record
      const walletTx = await manager.findOne(WalletTransaction, {
        where: { reference },
        lock: { mode: 'pessimistic_write' },
      });

      if (!walletTx) {
        this.logger.warn(`WalletTransaction not found: ${reference}`);
        return;
      }

      if (walletTx.status === 'success') {
        this.logger.log(`Wallet already credited: ${reference}`);
        return;
      }

      // Fetch and lock the wallet separately
      const wallet = await manager.findOne(Wallet, {
        where: { id: walletTx.wallet.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for tx: ${reference}`);
        return;
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + amountInNaira;
      walletTx.status = 'success';

      await manager.save(Wallet, wallet);
      await manager.save(WalletTransaction, walletTx);

      this.logger.log(`Payment: ${reference} | Credited: ₦${amountInNaira}`);
    });
  }

  /** Manual Status Check */
  async checkStatus(reference: string) {
    const tx = await this.walletTxRepo.findOne({ where: { reference } });

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
  async transfer(sender: UserReq, wallet_number: string, amount: number) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (!WalletNumberHelper.isValid(wallet_number)) {
      throw new BadRequestException('Invalid wallet number format');
    }

    return await this.walletRepo.manager.transaction(async (manager) => {
      // Get sender's wallet
      const senderWallet = await manager.findOne(Wallet, {
        where: { userId: sender.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      // Get receiver's wallet by wallet number
      const receiverWallet = await manager.findOne(Wallet, {
        where: { wallet_number },
        lock: { mode: 'pessimistic_write' },
      });

      if (!receiverWallet) {
        throw new NotFoundException('Receiver wallet not found');
      }

      // Prevent self-transfer
      if (senderWallet.id === receiverWallet.id) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      // Check balance
      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Generate reference
      const reference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Deduct from sender
      senderWallet.balance = Number(senderWallet.balance) - amount;
      const debitTx = this.walletTxRepo.create({
        wallet: senderWallet,
        amount: -amount,
        reference,
        type: 'transfer',
        status: 'success',
      });

      // Credit receiver
      receiverWallet.balance = Number(receiverWallet.balance) + amount;
      const creditTx = this.walletTxRepo.create({
        wallet: receiverWallet,
        amount,
        reference,
        type: 'transfer',
        status: 'success',
      });

      // Save all
      await manager.save(Wallet, [senderWallet, receiverWallet]);
      await manager.save(WalletTransaction, [debitTx, creditTx]);

      this.logger.log(`Transfer: ₦${amount} | ${wallet_number}`);

      return {
        status: 'success',
        message: 'Transfer completed',
        reference,
        amount,
        recipient: {
          wallet_number: receiverWallet.wallet_number,
        },
      };
    });
  }

  /** History
   * @param user - User entity
   */
  async history(user: UserReq) {
    return this.walletTxRepo.find({
      where: { wallet: { user: { id: user.id } } },
    });
  }

  private verifyPaystackSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.get<string>('paystack.secretKey');

    if (!secret) {
      this.logger.error('Paystack secret key not configured');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  }
}
