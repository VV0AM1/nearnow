import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginInput, SignupInput } from './dto/create-auth.input';
import { AuthResponse } from './entities/auth-response.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    // For MVP/Dev without password, we simply find the user by email.
    // In a real app, we would verify password here.
    const users = await this.usersService.findAll(); // Optimization: should add findByEmail to UsersService
    const user = users.find((u) => u.email === loginInput.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async signup(signupInput: SignupInput): Promise<AuthResponse> {
    const user = await this.usersService.create(signupInput);
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
