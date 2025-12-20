import { AuthService } from './auth.service';
import { User } from '../graphql-models';
import { LoginInput, SignupInput } from './dto/create-auth.input';
export declare class AuthResolver {
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
    me(user: User): User;
}
