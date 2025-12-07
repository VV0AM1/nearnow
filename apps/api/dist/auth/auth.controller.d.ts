import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/create-auth.input';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginInput: LoginInput): Promise<import("./entities/auth-response.entity").AuthResponse>;
    signup(signupInput: SignupInput): Promise<import("./entities/auth-response.entity").AuthResponse>;
    getProfile(req: any): any;
}
