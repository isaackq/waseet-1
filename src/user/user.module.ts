import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthController } from 'src/auth/auth.controller';
import { BcryptHashingProvider } from 'src/auth/providers/bcrypt.hashing.provider';
import { AuthService } from 'src/auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { TokenGenerator } from 'src/auth/providers/token-generator.provider';
import { CurrencyModule } from 'src/wallet/modules/currency.module';
import {
  UserCurrency,
  UserCurrencySchema,
} from 'src/wallet/schemas/user-currency.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import {
  SignupVerification,
  SignupVerificationSchema,
} from 'src/auth/schemas/signup-verification.schema';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UploadsModule } from 'src/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: UserCurrency.name,
        schema: UserCurrencySchema,
      },
      {
        name: Wallet.name,
        schema: WalletSchema,
      },
      {
        name: SignupVerification.name,
        schema: SignupVerificationSchema,
      },
    ]),
    CurrencyModule,
    PaginationModule,
    UploadsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: configService.get('jwt.signOptions'),
      }),
      global: true,
    }),
  ],
  exports: [UserService],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    AuthService,
    { provide: 'HashingProvider', useClass: BcryptHashingProvider },
    { provide: 'TokenGenerator', useClass: TokenGenerator },
  ],
})
export class UserModule {}
