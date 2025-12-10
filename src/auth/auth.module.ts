import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserModule } from '../user/user.module';
import { JwtConfigModule } from './jwt/jwt.module';
import { AuthController } from './auth.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [UserModule, JwtConfigModule, WalletModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
