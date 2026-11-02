import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { appConfig } from '../common/env';

@Module({
  controllers: [AuthController],
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: appConfig().jwtSecret,
        signOptions: {
          expiresIn: appConfig().jwtExpiresIn as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
