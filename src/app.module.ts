import config from './config';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyModule } from './api-key/api-key.module';
import { PaymentModule } from './payment/payment.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('db.url'),
        autoLoadEntities: true,
        synchronize: true,
        /* extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        }, */
      }),
    }),
    AuthModule,
    UserModule,
    DatabaseModule,
    PaymentModule,
    ApiKeyModule,
    WalletModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
