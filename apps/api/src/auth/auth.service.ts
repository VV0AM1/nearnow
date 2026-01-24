import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginInput, SignupInput, GoogleLoginInput, FacebookLoginInput, VerifyOtpInput } from './dto/create-auth.input';
import { AuthResponse } from './entities/auth-response.entity';
import { User } from '../users/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async getProfileStats(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { posts: true, votes: true }
        }
      }
    });
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  async login(loginInput: LoginInput): Promise<{ message: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginInput.email },
      include: { auth: true }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked.');
    }

    // Auto-heal: If user exists but no Auth record, create it now (Migration Logic)
    if (!user.auth) {
      console.warn(`[Auto-Heal] Creating missing Auth record for user ${user.id}`);
      await this.prisma.auth.create({
        data: {
          userId: user.id,
          passwordHash: loginInput.password
        }
      });
      // Return fresh login call
      return this.login(loginInput);
    }

    if (user.auth.passwordHash !== loginInput.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Trigger OTP flow (Non-blocking)
    this.requestOtp(user.email).catch(e => console.error("OTP Send Failed:", e));

    return {
      message: 'OTP sent to your email',
      email: user.email
    };
  }

  async signup(signupInput: SignupInput): Promise<{ message: string; email: string }> {
    const users = await this.usersService.findAll();
    if (users.find(u => u.email === signupInput.email)) {
      throw new BadRequestException('User already exists');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = signupInput;

    // 1. Create User
    const user = await this.usersService.create({
      email: userData.email,
      name: userData.name
    } as any); // Cast avoiding strict DTO issues if any

    // 2. Create Auth Record
    await this.prisma.auth.create({
      data: {
        userId: user.id,
        passwordHash: password, // In prod: bcrypt.hashSync(password, 10)
      }
    });

    try {
      if (signupInput.name) {
        this.emailService.sendWelcome(user.email, signupInput.name).catch(e => console.error("Welcome Email Failed:", e));
      }
      this.requestOtp(user.email).catch(e => console.error("OTP Email Failed:", e));
    } catch (e) {
      console.error("Email initiation failed:", e);
    }

    return {
      message: 'Account created. Check email for OTP.',
      email: user.email
    };
  }

  // --- Google Auth ---
  async googleLogin(input: GoogleLoginInput): Promise<AuthResponse> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: input.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid Google Token');

      const { email, name, sub: googleId, picture } = payload;

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: email!,
            name: name || 'User',
            avatar: picture,
            auth: {
              create: { googleId }
            }
          },
        });
      } else {
        const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
        if (!auth) {
          await this.prisma.auth.create({ data: { userId: user.id, googleId } });
        } else if (!auth.googleId) {
          await this.prisma.auth.update({ where: { id: auth.id }, data: { googleId } });
        }
      }

      if (user.isBlocked) {
        throw new UnauthorizedException('Your account has been blocked.');
      }

      return this.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException('Google Auth Failed: ' + error.message);
    }
  }

  // --- Facebook Auth ---
  async facebookLogin(input: FacebookLoginInput): Promise<AuthResponse> {
    try {
      // Validate Token via Graph API
      const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${input.token}`);
      if (!res.ok) {
        throw new UnauthorizedException('Invalid Facebook Token');
      }
      const data = await res.json();

      const email = data.email;
      const facebookId = data.id;
      const name = data.name;
      // Facebook picture is nested: data.picture.data.url
      const avatar = data.picture?.data?.url;

      if (!email) {
        // Facebook might not return email if user disallowed it.
        // For MVP we require email.
        throw new BadRequestException('Facebook account must have an email address.');
      }

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            name: name || 'User',
            avatar,
            auth: {
              create: { facebookId }
            }
          },
        });
      } else {
        const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
        if (!auth) {
          await this.prisma.auth.create({ data: { userId: user.id, facebookId } });
        } else if (!auth.facebookId) {
          await this.prisma.auth.update({ where: { id: auth.id }, data: { facebookId } });
        }
      }

      if (user.isBlocked) {
        throw new UnauthorizedException('Your account has been blocked.');
      }

      return this.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException('Facebook Auth Failed: ' + (error.message || 'Unknown error'));
    }
  }

  // --- OTP Logic ---
  async requestOtp(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
    if (!auth) {
      auth = await this.prisma.auth.create({ data: { userId: user.id } });
    }

    await this.prisma.auth.update({
      where: { id: auth.id },
      data: { emailOtp: otp, otpExpires: expires },
    });

    await this.emailService.sendOtp(email, otp);
    return true;
  }

  async verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('User not found');

    const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
    if (!auth || !auth.emailOtp || !auth.otpExpires) {
      throw new UnauthorizedException('No OTP requested');
    }

    if (new Date() > auth.otpExpires) {
      throw new UnauthorizedException('OTP Expired');
    }

    // Master OTP for Demo/Testing if email fails
    if (input.otp !== '123456' && auth.emailOtp !== input.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.auth.update({
      where: { id: auth.id },
      data: { emailOtp: null, otpExpires: null }
    });

    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponse {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  // --- Password Recovery ---
  async requestPasswordReset(email: string): Promise<boolean> {
    return this.requestOtp(email);
  }

  async resetPassword(input: VerifyOtpInput & { newPassword: string }): Promise<boolean> {
    await this.verifyOtp({ email: input.email, otp: input.otp });

    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('User not found');

    const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
    if (!auth) throw new BadRequestException('Auth record not found');

    await this.prisma.auth.update({
      where: { id: auth.id },
      data: { passwordHash: input.newPassword }
    });

    return true;
  }
}
