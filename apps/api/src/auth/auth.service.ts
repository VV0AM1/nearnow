import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import type { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { HOUR, MINUTE, RateLimitService } from '../common/rate-limit.service';
import {
  generateOtp,
  hashOtp,
  hashPassword,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  otpMatches,
  verifyPassword,
} from './credentials';
import {
  LoginDto,
  ProviderTokenDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from './dto/auth.dto';

/** The signed-in user's own profile fields (includes email; never shown to others). */
export interface SelfUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  role: User['role'];
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: SelfUser;
}

export const toSelfUser = (u: User): SelfUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatar: u.avatar,
  bio: u.bio,
  role: u.role,
  createdAt: u.createdAt,
});

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_CODE = 'The code is invalid or has expired. Request a new one.';
const CODE_SENT =
  'If the details are correct, a verification code has been sent to your email.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
  );

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
  ) {}

  /** Throws if the account may not sign in. */
  private assertActive(user: User) {
    if (user.deletedAt) throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (user.isBlocked)
      throw new UnauthorizedException('This account has been suspended.');
  }

  async signup(
    input: SignupDto,
    ip: string,
  ): Promise<{ message: string; email: string }> {
    this.rateLimit.consume(`signup:${ip}`, 10, HOUR);

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing)
      throw new ConflictException(
        'An account with this email already exists. Try signing in.',
      );

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        auth: { create: { passwordHash } },
      },
    });

    await this.issueOtp(user.id, user.email);
    void this.emailService.sendWelcome(user.email, input.name);

    return {
      message: 'Account created. Enter the verification code we emailed you.',
      email: user.email,
    };
  }

  /** Step 1 of sign-in: checks the password and emails a one-time code. */
  async login(
    input: LoginDto,
    ip: string,
  ): Promise<{ message: string; email: string }> {
    this.rateLimit.consume(`login:ip:${ip}`, 30, 15 * MINUTE);
    this.rateLimit.consume(
      `login:email:${input.email}`,
      10,
      15 * MINUTE,
      'Too many sign-in attempts. Try again in 15 minutes.',
    );

    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { auth: true },
    });
    const check = await verifyPassword(
      input.password,
      user?.auth?.passwordHash,
    );
    if (!user || !user.auth || !check.valid)
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    this.assertActive(user);

    if (check.needsRehash) {
      await this.prisma.auth.update({
        where: { id: user.auth.id },
        data: { passwordHash: await hashPassword(input.password) },
      });
      this.logger.log(`Upgraded legacy password storage for user ${user.id}`);
    }

    await this.issueOtp(user.id, user.email);
    return {
      message: 'We sent a 6-digit verification code to your email.',
      email: user.email,
    };
  }

  /** Step 2 of sign-in (and email verification after sign-up). */
  async verifyOtp(input: VerifyOtpDto): Promise<AuthResponse> {
    const user = await this.consumeOtp(input.email, input.otp);
    return this.generateToken(user);
  }

  async requestPasswordReset(
    email: string,
    ip: string,
  ): Promise<{ message: string }> {
    this.rateLimit.consume(`reset:ip:${ip}`, 10, HOUR);
    if (!this.rateLimit.tryConsume(`reset:email:${email}`, 3, HOUR))
      return { message: CODE_SENT };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && !user.isBlocked) {
      try {
        await this.issueOtp(user.id, user.email);
      } catch (e) {
        // Do not reveal whether the account exists through a different error.
        this.logger.warn(
          `Password reset code could not be sent: ${(e as Error).message}`,
        );
      }
    }
    return { message: CODE_SENT };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.consumeOtp(input.email, input.otp);
    await this.prisma.auth.update({
      where: { userId: user.id },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });
    return { message: 'Your password has been changed. You can now sign in.' };
  }

  async googleLogin(input: ProviderTokenDto): Promise<AuthResponse> {
    if (!process.env.GOOGLE_CLIENT_ID)
      throw new BadRequestException('Google sign-in is not configured.');
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: input.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google sign-in failed.');
    }
    if (!payload?.email || !payload.email_verified)
      throw new UnauthorizedException('Google account email is not verified.');
    const user = await this.upsertProviderUser(
      payload.email.toLowerCase(),
      payload.name,
      payload.picture,
      { googleId: payload.sub },
    );
    return this.generateToken(user);
  }

  async facebookLogin(input: ProviderTokenDto): Promise<AuthResponse> {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(input.token)}`,
    ).catch(() => null);
    if (!res?.ok) throw new UnauthorizedException('Facebook sign-in failed.');
    const data = (await res.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };
    if (!data.id) throw new UnauthorizedException('Facebook sign-in failed.');
    if (!data.email)
      throw new BadRequestException(
        'Your Facebook account must share an email address to sign in.',
      );
    const user = await this.upsertProviderUser(
      data.email.toLowerCase(),
      data.name,
      data.picture?.data?.url,
      { facebookId: data.id },
    );
    return this.generateToken(user);
  }

  private async upsertProviderUser(
    email: string,
    name: string | undefined,
    avatar: string | undefined,
    link: { googleId?: string; facebookId?: string },
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { auth: true },
    });
    if (!user) {
      return this.prisma.user.create({
        data: {
          email,
          name: name || null,
          avatar: avatar || null,
          auth: { create: link },
        },
      });
    }
    this.assertActive(user);
    if (!user.auth) {
      await this.prisma.auth.create({ data: { userId: user.id, ...link } });
    } else if (
      (link.googleId && !user.auth.googleId) ||
      (link.facebookId && !user.auth.facebookId)
    ) {
      await this.prisma.auth.update({
        where: { id: user.auth.id },
        data: link,
      });
    }
    user = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { auth: true },
    });
    return user;
  }

  private async issueOtp(userId: string, email: string) {
    this.rateLimit.consume(
      `otp:send:${email}`,
      5,
      HOUR,
      'Too many codes requested. Try again later.',
    );
    const otp = generateOtp();
    await this.prisma.auth.upsert({
      where: { userId },
      update: {
        emailOtp: hashOtp(email, otp),
        otpExpires: new Date(Date.now() + OTP_TTL_MS),
        otpAttempts: 0,
      },
      create: {
        userId,
        emailOtp: hashOtp(email, otp),
        otpExpires: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.emailService.sendOtp(email, otp);
  }

  /** Validates and burns a one-time code. Wrong guesses count towards a hard limit. */
  private async consumeOtp(email: string, otp: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { auth: true },
    });
    const auth = user?.auth;
    if (
      !user ||
      !auth?.emailOtp ||
      !auth.otpExpires ||
      auth.otpExpires < new Date() ||
      auth.otpAttempts >= OTP_MAX_ATTEMPTS
    ) {
      throw new UnauthorizedException(INVALID_CODE);
    }
    if (!otpMatches(email, otp, auth.emailOtp)) {
      const attempts = auth.otpAttempts + 1;
      await this.prisma.auth.update({
        where: { id: auth.id },
        data:
          attempts >= OTP_MAX_ATTEMPTS
            ? { otpAttempts: attempts, emailOtp: null, otpExpires: null }
            : { otpAttempts: attempts },
      });
      throw new UnauthorizedException(INVALID_CODE);
    }
    this.assertActive(user);
    await this.prisma.auth.update({
      where: { id: auth.id },
      data: { emailOtp: null, otpExpires: null, otpAttempts: 0 },
    });
    return user;
  }

  private generateToken(user: User): AuthResponse {
    const accessToken = this.jwtService.sign({ sub: user.id });
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);
    return {
      accessToken,
      expiresAt: new Date(exp * 1000).toISOString(),
      user: toSelfUser(user),
    };
  }
}
