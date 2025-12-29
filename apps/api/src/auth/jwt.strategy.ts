import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret',
        });
    }

    async validate(payload: { sub: string; email: string }) {
        console.log('JWT Validate Payload:', payload);
        const user = await this.usersService.findOne(payload.sub);
        if (!user) {
            console.log('JWT Validate: User not found for id', payload.sub);
            throw new UnauthorizedException();
        }
        if (user.isBlocked) {
            console.log('JWT Validate: User is blocked', payload.sub);
            throw new UnauthorizedException('User is blocked');
        }
        return user;
    }
}
