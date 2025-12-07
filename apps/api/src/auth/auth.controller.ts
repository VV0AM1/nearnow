import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/create-auth.input';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() loginInput: LoginInput) {
        return this.authService.login(loginInput);
    }

    @Post('signup')
    signup(@Body() signupInput: SignupInput) {
        return this.authService.signup(signupInput);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req) {
        return req.user;
    }
}
