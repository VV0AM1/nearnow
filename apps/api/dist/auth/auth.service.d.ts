import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginInput, SignupInput } from './dto/create-auth.input';
import { AuthResponse } from './entities/auth-response.entity';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(userId: string): Promise<User | null>;
    login(loginInput: LoginInput): Promise<AuthResponse>;
    signup(signupInput: SignupInput): Promise<AuthResponse>;
}
