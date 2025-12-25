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

    @Post('google')
    googleLogin(@Body() input: any) { // using any or specific DTO
        return this.authService.googleLogin(input);
    }

    @Post('facebook')
    facebookLogin(@Body() input: any) {
        return this.authService.facebookLogin(input);
    }

    @Post('otp/request')
    requestOtp(@Body() body: { email: string }) {
        return this.authService.requestOtp(body.email);
    }

    @Post('otp/verify')
    verifyOtp(@Body() input: any) {
        return this.authService.verifyOtp(input);
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.requestPasswordReset(body.email);
    }

    @Post('reset-password')
    resetPassword(@Body() input: any) {
        return this.authService.resetPassword(input);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        // req.user contains basic info from JWT. We need fresh stats for gamification.
        // We can't easily access PrismaService here directly without injecting it, 
        // but AuthService has UsersService, or we can add a method to AuthService.
        return this.authService.getProfileStats(req.user.id);
    }
}
