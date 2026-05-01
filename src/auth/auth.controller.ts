import {
  HttpStatus,
  Body,
  Controller,
  HttpCode,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { LogInDto } from './dto/request/login.request.dto';
import { Token } from './dto/response/token.response.dto';
import { AuthService } from './auth.service';
import { SignupRequestDto } from './dto/request/signup.request.dto';
import { SignupVerifyRequestDto } from './dto/request/signup-verify.request.dto';
import { RefreshTokenRequestDto } from './dto/request/refresh-token.request.dto';
import { AccessTokenResponseDto } from './dto/response/access-token.response.dto';
import { ForgotPasswordRequestDto } from './dto/request/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/request/reset-password.request.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { User } from 'src/user/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LogInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: Token,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'UNAUTHORIZED',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to store refresh token',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body(new ValidationPipe()) loginDto: LogInDto): Promise<Token> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access token refreshed successfully',
    type: AccessTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Body(new ValidationPipe()) refreshTokenDto: RefreshTokenRequestDto,
  ): Promise<AccessTokenResponseDto> {
    return this.authService.refreshAccessToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset request accepted',
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ValidationPipe()) dto: ForgotPasswordRequestDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body(new ValidationPipe()) dto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Roles([
    RolesEnum.ADMIN,
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
  ])
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User logged out successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@CurrentUser() currentUser: User): Promise<void> {
    await this.authService.logout(currentUser);
  }

  @ApiOperation({ summary: 'Request signup verification code' })
  @ApiBody({ type: SignupRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent',
  })
  @Post('signup/request')
  async requestSignup(
    @Body(new ValidationPipe()) signupDto: SignupRequestDto,
  ) {
    return this.authService.requestSignup(signupDto);
  }

  @ApiOperation({ summary: 'Verify signup code and create user' })
  @ApiBody({ type: SignupVerifyRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Signup completed',
    type: Token,
  })
  @Post('signup/verify')
  async verifySignup(
    @Body(new ValidationPipe()) verifyDto: SignupVerifyRequestDto,
  ): Promise<Token> {
    return this.authService.verifySignup(verifyDto);
  }
}
