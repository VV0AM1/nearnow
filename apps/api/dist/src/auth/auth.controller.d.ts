import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/create-auth.input';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginInput: LoginInput): Promise<{
        message: string;
        email: string;
    }>;
    signup(signupInput: SignupInput): Promise<{
        message: string;
        email: string;
    }>;
    googleLogin(input: any): Promise<import("./entities/auth-response.entity").AuthResponse>;
    requestOtp(body: {
        email: string;
    }): Promise<boolean>;
    verifyOtp(input: any): Promise<import("./entities/auth-response.entity").AuthResponse>;
    forgotPassword(body: {
        email: string;
    }): Promise<boolean>;
    resetPassword(input: any): Promise<boolean>;
    getProfile(req: any): Promise<({
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
}
