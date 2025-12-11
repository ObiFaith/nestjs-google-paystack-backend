import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet, WalletTransaction } from './entities';
import { ApiKeyModule } from '../api-key/api-key.module';
import { PaymentModule } from '../payment/payment.module';
import { Payment } from 'src/payment/entities/payment.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Payment, WalletTransaction]),
    PaymentModule,
    ApiKeyModule,
    UserModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
