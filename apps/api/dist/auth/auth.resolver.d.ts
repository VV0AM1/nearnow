import { AuthService } from './auth.service';
import { User } from '../graphql-models';
import { LoginInput, SignupInput } from './dto/create-auth.input';
export declare class AuthResolver {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginInput: LoginInput): Promise<import("./entities/auth-response.entity").AuthResponse>;
    signup(signupInput: SignupInput): Promise<import("./entities/auth-response.entity").AuthResponse>;
    me(user: User): User;
}
