export declare class EmailService {
    private transporter;
    constructor();
    sendOtp(email: string, otp: string): Promise<void>;
    sendWelcome(email: string, name: string): Promise<void>;
    private sendMail;
}
