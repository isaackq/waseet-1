import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import { Model } from 'mongoose';
import { TokenGeneratorInterface } from '../interfaces/token-generator.interface';
import { Token } from '../dto/response/token.response.dto';
import { User, UserDocument } from 'src/user/user.schema';

@Injectable()
export class TokenGenerator implements TokenGeneratorInterface {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtconfig: ConfigType<typeof jwtConfig>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async generateTokens(user: User): Promise<Token> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(user.id, this.jwtconfig.accessTokenTTL, {
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
        tokenType: 'access',
      }),
      this.generateToken(user.id, this.jwtconfig.refreshTokenTTL, {
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
        tokenType: 'refresh',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<Pick<Token, 'accessToken'>> {
    try {
      const { sub, tokenVersion, tokenType } =
        this.jwtService.verify(refreshToken);

      if (tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userModel.findById(sub).exec();
      if (!user || user.isActive === false || tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('User not found');
      }
      const accessToken = await this.generateToken(
        sub,
        this.jwtconfig.accessTokenTTL,
        {
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          tokenVersion: user.tokenVersion ?? 0,
          tokenType: 'access',
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateToken<T>(sub: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      { sub: sub, ...payload },
      { expiresIn: expiresIn },
    );
  }
}
