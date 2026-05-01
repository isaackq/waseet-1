import {
  BadRequestException,
  Injectable,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { UserService } from '../user/user.service';
import type { TokenGeneratorInterface } from './interfaces/token-generator.interface';
import type { HashingProviderInterface } from './interfaces/hashing.provider.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  SignupVerification,
  SignupVerificationDocument,
} from './schemas/signup-verification.schema';
import { Model } from 'mongoose';
import { MailService } from 'src/mail1/providers/mail.service';
import { SignupRequestDto } from './dto/request/signup.request.dto';
import { SignupVerifyRequestDto } from './dto/request/signup-verify.request.dto';
import { UserRequestDto } from 'src/user/dto/request/user.request.dto';
import { RefreshTokenRequestDto } from './dto/request/refresh-token.request.dto';
import { AccessTokenResponseDto } from './dto/response/access-token.response.dto';
import { LogInDto } from './dto/request/login.request.dto';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { User } from 'src/user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject('HashingProvider')
    private readonly hashingProvider: HashingProviderInterface,

    @Inject('TokenGenerator')
    private readonly tokenGenerator: TokenGeneratorInterface,

    private readonly userService: UserService,
    @InjectModel(SignupVerification.name)
    private readonly signupVerificationModel: Model<SignupVerificationDocument>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LogInDto) {
    const { email, password, rememberMe = false } = loginDto;

    const user = await this.userService.findOneByEmail(email);
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const correctPassword = await this.hashingProvider.compare(
      password,
      user.password,
    );

    if (!correctPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.updateRememberMe(user.id, rememberMe);
    await this.userService.updateLastLogin(user.id);
    user.rememberMe = rememberMe;
    user.lastLoginAt = new Date();

    return this.tokenGenerator.generateTokens(user);
  }

  async refreshAccessToken(
    refreshTokenDto: RefreshTokenRequestDto,
  ): Promise<AccessTokenResponseDto> {
    return this.tokenGenerator.refreshToken(refreshTokenDto.refreshToken);
  }

  async forgotPassword(
    dto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findOneByEmail(dto.email);

    if (!user || user.isActive === false || !user.password) {
      return {
        message: 'If that email exists, a reset link has been sent',
      };
    }

    const frontendUrl = this.configService.get<string>('appConfig.frontendUrl');
    if (!frontendUrl) {
      throw new InternalServerErrorException('FRONTEND_URL is not configured');
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `${frontendUrl.replace(/\/+$/, '')}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetUrl,
    );

    return {
      message: 'If that email exists, a reset link has been sent',
    };
  }

  async resetPassword(
    dto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    const hashedToken = this.hashResetToken(dto.token.trim());
    const user = await this.userService.findOneByResetToken(hashedToken);

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt <= new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const isSamePassword = await this.hashingProvider.compare(
      dto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    user.password = await this.hashingProvider.hash(dto.newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  async logout(currentUser: User): Promise<void> {
    await this.userService.logout(currentUser.id);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestSignup(signupDto: SignupRequestDto) {
    await this.userService.checkIfUserExists(signupDto);

    const code = this.generateCode();
    const codeHash = await this.hashingProvider.hash(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.signupVerificationModel.findOneAndUpdate(
      { email: signupDto.email },
      {
        $set: {
          email: signupDto.email,
          codeHash: codeHash,
          expiresAt: expiresAt,
          payload: signupDto,
        },
      },
      { upsert: true, new: true },
    );

    await this.mailService.sendSignupCode(
      signupDto.email,
      signupDto.firstName,
      code,
    );

    return { message: 'Verification code sent to email' };
  }

  async verifySignup(verifyDto: SignupVerifyRequestDto) {
    const record = await this.signupVerificationModel.findOne({
      email: verifyDto.email,
    });
    if (!record) {
      throw new BadRequestException('Verification code not found');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    const ok = await this.hashingProvider.compare(
      verifyDto.code,
      record.codeHash,
    );
    if (!ok) {
      throw new BadRequestException('Invalid verification code');
    }
    await this.userService.createUser(record.payload as UserRequestDto);
    const user = await this.userService.findOneByEmail(verifyDto.email);
    if (!user) {
      throw new BadRequestException('Signup failed');
    }
    await this.signupVerificationModel.deleteOne({ email: verifyDto.email });

    return this.tokenGenerator.generateTokens(user as any);
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
