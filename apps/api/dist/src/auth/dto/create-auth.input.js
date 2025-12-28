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
exports.VerifyOtpInput = exports.FacebookLoginInput = exports.GoogleLoginInput = exports.SignupInput = exports.LoginInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let LoginInput = class LoginInput {
    email;
    password;
};
exports.LoginInput = LoginInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginInput.prototype, "password", void 0);
exports.LoginInput = LoginInput = __decorate([
    (0, graphql_1.InputType)()
], LoginInput);
let SignupInput = class SignupInput {
    email;
    password;
    name;
};
exports.SignupInput = SignupInput;
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignupInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupInput.prototype, "name", void 0);
exports.SignupInput = SignupInput = __decorate([
    (0, graphql_1.InputType)()
], SignupInput);
let GoogleLoginInput = class GoogleLoginInput {
    token;
};
exports.GoogleLoginInput = GoogleLoginInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], GoogleLoginInput.prototype, "token", void 0);
exports.GoogleLoginInput = GoogleLoginInput = __decorate([
    (0, graphql_1.InputType)()
], GoogleLoginInput);
let FacebookLoginInput = class FacebookLoginInput {
    token;
};
exports.FacebookLoginInput = FacebookLoginInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], FacebookLoginInput.prototype, "token", void 0);
exports.FacebookLoginInput = FacebookLoginInput = __decorate([
    (0, graphql_1.InputType)()
], FacebookLoginInput);
let VerifyOtpInput = class VerifyOtpInput {
    email;
    otp;
};
exports.VerifyOtpInput = VerifyOtpInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], VerifyOtpInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], VerifyOtpInput.prototype, "otp", void 0);
exports.VerifyOtpInput = VerifyOtpInput = __decorate([
    (0, graphql_1.InputType)()
], VerifyOtpInput);
//# sourceMappingURL=create-auth.input.js.map