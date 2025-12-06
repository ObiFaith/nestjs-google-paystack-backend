import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtConfigModule } from './jwt/jwt.module';

@Module({
  imports: [UserModule, JwtConfigModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
