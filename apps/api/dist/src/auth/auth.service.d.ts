import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginInput, SignupInput, GoogleLoginInput, VerifyOtpInput } from './dto/create-auth.input';
import { AuthResponse } from './entities/auth-response.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private emailService;
    private prisma;
    private googleClient;
    constructor(usersService: UsersService, jwtService: JwtService, emailService: EmailService, prisma: PrismaService);
    getProfileStats(userId: string): Promise<({
        _count: {
            posts: number;
            votes: number;
        };
    } & {
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        bio: string | null;
        role: import(".prisma/client").$Enums.Role;
        reputation: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    validateUser(userId: string): Promise<User | null>;
    login(loginInput: LoginInput): Promise<{
        message: string;
        email: string;
    }>;
    signup(signupInput: SignupInput): Promise<{
        message: string;
        email: string;
    }>;
    googleLogin(input: GoogleLoginInput): Promise<AuthResponse>;
    requestOtp(email: string): Promise<boolean>;
    verifyOtp(input: VerifyOtpInput): Promise<AuthResponse>;
    private generateToken;
    requestPasswordReset(email: string): Promise<boolean>;
    resetPassword(input: VerifyOtpInput & {
        newPassword: string;
    }): Promise<boolean>;
}
