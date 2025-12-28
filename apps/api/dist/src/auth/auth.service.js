"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const google_auth_library_1 = require("google-auth-library");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    emailService;
    prisma;
    googleClient;
    constructor(usersService, jwtService, emailService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.prisma = prisma;
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }
    async getProfileStats(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { posts: true, votes: true }
                }
            }
        });
    }
    async validateUser(userId) {
        return this.usersService.findOne(userId);
    }
    async login(loginInput) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginInput.email },
            include: { auth: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.isBlocked) {
            throw new common_1.UnauthorizedException('Your account has been blocked.');
        }
        if (!user.auth) {
            console.warn(`[Auto-Heal] Creating missing Auth record for user ${user.id}`);
            await this.prisma.auth.create({
                data: {
                    userId: user.id,
                    passwordHash: loginInput.password
                }
            });
            return this.login(loginInput);
        }
        if (user.auth.passwordHash !== loginInput.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.requestOtp(user.email);
        return {
            message: 'OTP sent to your email',
            email: user.email
        };
    }
    async signup(signupInput) {
        const users = await this.usersService.findAll();
        if (users.find(u => u.email === signupInput.email)) {
            throw new common_1.BadRequestException('User already exists');
        }
        const { password, ...userData } = signupInput;
        const user = await this.usersService.create({
            email: userData.email,
            name: userData.name
        });
        await this.prisma.auth.create({
            data: {
                userId: user.id,
                passwordHash: password,
            }
        });
        try {
            if (signupInput.name) {
                await this.emailService.sendWelcome(user.email, signupInput.name);
            }
            await this.requestOtp(user.email);
        }
        catch (e) {
            console.error("Email failed:", e);
        }
        return {
            message: 'Account created. Check email for OTP.',
            email: user.email
        };
    }
    async googleLogin(input) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: input.token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload)
                throw new common_1.UnauthorizedException('Invalid Google Token');
            const { email, name, sub: googleId, picture } = payload;
            let user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email: email,
                        name: name || 'User',
                        avatar: picture,
                        auth: {
                            create: { googleId }
                        }
                    },
                });
            }
            else {
                const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
                if (!auth) {
                    await this.prisma.auth.create({ data: { userId: user.id, googleId } });
                }
                else if (!auth.googleId) {
                    await this.prisma.auth.update({ where: { id: auth.id }, data: { googleId } });
                }
            }
            if (user.isBlocked) {
                throw new common_1.UnauthorizedException('Your account has been blocked.');
            }
            return this.generateToken(user);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Google Auth Failed: ' + error.message);
        }
    }
    async facebookLogin(input) {
        try {
            const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${input.token}`);
            if (!res.ok) {
                throw new common_1.UnauthorizedException('Invalid Facebook Token');
            }
            const data = await res.json();
            const email = data.email;
            const facebookId = data.id;
            const name = data.name;
            const avatar = data.picture?.data?.url;
            if (!email) {
                throw new common_1.BadRequestException('Facebook account must have an email address.');
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
            }
            else {
                const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
                if (!auth) {
                    await this.prisma.auth.create({ data: { userId: user.id, facebookId } });
                }
                else if (!auth.facebookId) {
                    await this.prisma.auth.update({ where: { id: auth.id }, data: { facebookId } });
                }
            }
            if (user.isBlocked) {
                throw new common_1.UnauthorizedException('Your account has been blocked.');
            }
            return this.generateToken(user);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Facebook Auth Failed: ' + (error.message || 'Unknown error'));
        }
    }
    async requestOtp(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);
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
    async verifyOtp(input) {
        const user = await this.prisma.user.findUnique({ where: { email: input.email } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
        if (!auth || !auth.emailOtp || !auth.otpExpires) {
            throw new common_1.UnauthorizedException('No OTP requested');
        }
        if (new Date() > auth.otpExpires) {
            throw new common_1.UnauthorizedException('OTP Expired');
        }
        if (auth.emailOtp !== input.otp) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        await this.prisma.auth.update({
            where: { id: auth.id },
            data: { emailOtp: null, otpExpires: null }
        });
        return this.generateToken(user);
    }
    generateToken(user) {
        const payload = { email: user.email, sub: user.id };
        return {
            accessToken: this.jwtService.sign(payload),
            user,
        };
    }
    async requestPasswordReset(email) {
        return this.requestOtp(email);
    }
    async resetPassword(input) {
        await this.verifyOtp({ email: input.email, otp: input.otp });
        const user = await this.prisma.user.findUnique({ where: { email: input.email } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const auth = await this.prisma.auth.findUnique({ where: { userId: user.id } });
        if (!auth)
            throw new common_1.BadRequestException('Auth record not found');
        await this.prisma.auth.update({
            where: { id: auth.id },
            data: { passwordHash: input.newPassword }
        });
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        email_service_1.EmailService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map