import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  EmailDto,
  LoginDto,
  ProviderTokenDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  signup(@Body() body: SignupDto, @ClientIp() ip: string) {
    return this.authService.signup(body, ip);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto, @ClientIp() ip: string) {
    return this.authService.login(body, ip);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() body: EmailDto, @ClientIp() ip: string) {
    return this.authService.requestPasswordReset(body.email, ip);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('google')
  @HttpCode(200)
  googleLogin(@Body() body: ProviderTokenDto) {
    return this.authService.googleLogin(body);
  }

  @Post('facebook')
  @HttpCode(200)
  facebookLogin(@Body() body: ProviderTokenDto) {
    return this.authService.facebookLogin(body);
  }

  /** Alias of GET /users/me kept for the web client. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.usersService.findProfile(user.id);
  }
}
