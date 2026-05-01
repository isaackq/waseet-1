import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { UserRequestDto } from './dto/request/user.request.dto';
import type { HashingProviderInterface } from 'src/auth/interfaces/hashing.provider.interface';
import { Birthday } from './ObjectValues/Birthday';
import { UserResponseDto } from './dto/response/user.response.dto';
import { AdminRequestDto } from './dto/request/admin.request.dto';
import { RolesEnum } from './enums/role.enum';
import { CurrencyService } from 'src/wallet/services/currency.service';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';
import {
  UserCurrency,
  UserCurrencyDocument,
} from 'src/wallet/schemas/user-currency.schema';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';
import { MailService } from 'src/mail1/providers/mail.service';
import { GetUsersRequestDto } from './dto/request/get-users.request.dto';
import { paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { Request } from 'express';
import { ChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { UpdateProfileRequestDto } from './dto/request/update-profile.request.dto';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { Token } from 'src/auth/dto/response/token.response.dto';
import type { TokenGeneratorInterface } from 'src/auth/interfaces/token-generator.interface';

type UniqueFields = {
  id: string;
  email: string;
  phoneNumber: string;
  identificationName: string;
};
type CanBeUpdated = {
  role: RolesEnum;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject('HashingProvider')
    private readonly hashingProvider: HashingProviderInterface,
    @Inject('TokenGenerator')
    private readonly tokenGenerator: TokenGeneratorInterface,
    private readonly currencyService: CurrencyService,
    private readonly mailService: MailService,
    private readonly paginationProvider: PaginationProvider,
    private readonly uploadsService: UploadsService,
  ) {}
  async createUser(userRequestDto: UserRequestDto): Promise<UserResponseDto> {
    await this.checkIfUserExists(userRequestDto);
    const encryptedPassword = await this.hashingProvider.hash(
      userRequestDto.password,
    );
    const birthday = new Birthday(userRequestDto.birthday);

    const user = {
      ...userRequestDto,
      password: encryptedPassword,
      birthday: birthday.value,
      role:
        userRequestDto instanceof AdminRequestDto
          ? RolesEnum.ADMIN
          : RolesEnum.USER,
      isActive: true,
      tokenVersion: 0,
      rememberMe: false,
    };

    if (userRequestDto instanceof AdminRequestDto) {
      const userDocument = await this.userModel.create(user);
      return UserResponseDto.createFromDocument(userDocument);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const [userDocument] = await this.userModel.create([user], { session });

      const currency = await this.currencyService.findByName(CurrencyEnum.USD);

      const [userCurrency] = await this.userCurrencyModel.create(
        [
          {
            userId: userDocument.id,
            currencyId: currency.id,
          },
        ],
        { session },
      );

      await this.walletModel.create(
        [
          {
            userCurrencyId: userCurrency.id,
            totalBalance: Types.Decimal128.fromString('0'),
            available: Types.Decimal128.fromString('0'),
            held: Types.Decimal128.fromString('0'),
            isActive: true,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      // await this.mailService.sendUserWelcome(userDocument);
      return UserResponseDto.createFromDocument(userDocument);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async checkIfUserExists(userRequestDto: UserRequestDto): Promise<void> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: userRequestDto.email },
        { identificationName: userRequestDto.identificationName },
        { phoneNumber: userRequestDto.phoneNumber },
      ],
    });
    if (existingUser) {
      if (existingUser.email === userRequestDto.email) {
        throw new BadRequestException('Email already exists');
      }
      if (
        existingUser.identificationName === userRequestDto.identificationName
      ) {
        throw new BadRequestException('Identification name already used');
      }
      if (existingUser.phoneNumber === userRequestDto.phoneNumber) {
        throw new BadRequestException('phone number already used');
      }
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return null;
    }
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }
    return user;
  }

  async findOneByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ resetPasswordToken: token }).exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    const normalized = identifier.trim().toLowerCase();
    return this.userModel
      .findOne({
        $or: [{ email: normalized }, { phoneNumber: identifier.trim() }],
      })
      .exec();
  }

  async updateRememberMe(userId: string, rememberMe: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { rememberMe }).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() })
      .exec();
  }

  async findAll(
    usersQuery: GetUsersRequestDto,
    request: Request,
  ): Promise<paginated<UserResponseDto>> {
    const filter: FilterQuery<UserDocument> = {};

    if (usersQuery.search?.trim()) {
      const search = usersQuery.search.trim();
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { middleName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { identificationName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (usersQuery.role) {
      filter.role = usersQuery.role;
    }

    if (typeof usersQuery.isActive === 'boolean') {
      filter.isActive = usersQuery.isActive;
    }

    if (usersQuery.startDate || usersQuery.endDate) {
      filter.createdAt = {};

      if (usersQuery.startDate) {
        filter.createdAt.$gte = usersQuery.startDate;
      }

      if (usersQuery.endDate) {
        filter.createdAt.$lte = usersQuery.endDate;
      }
    }

    const users = await this.paginationProvider.paginateMongooseQuery(
      {
        limit: usersQuery.limit,
        page: usersQuery.page,
      },
      this.userModel,
      filter,
      { createdAt: -1 },
      request,
    );

    return {
      ...users,
      data: users.data.map((user) => UserResponseDto.createFromDocument(user)),
    };
  }

  async updateOwnProfile(
    userId: string,
    profileUpdateDto: UpdateProfileRequestDto,
    avatarFile?: Express.Multer.File,
  ): Promise<UserDocument> {
    const user = await this.findExistingUser(userId);

    if (profileUpdateDto.email !== undefined) {
      const existingByEmail = await this.userModel.findOne({
        email: profileUpdateDto.email,
        _id: { $ne: userId },
      });
      if (existingByEmail) {
        throw new ConflictException('Email already exists');
      }
      user.email = profileUpdateDto.email;
    }

    if (profileUpdateDto.phoneNumber !== undefined) {
      const existingByPhone = await this.userModel.findOne({
        phoneNumber: profileUpdateDto.phoneNumber,
        _id: { $ne: userId },
      });
      if (existingByPhone) {
        throw new ConflictException('phone number already used');
      }
      user.phoneNumber = profileUpdateDto.phoneNumber;
    }

    if (profileUpdateDto.identificationName !== undefined) {
      const existingByIdentification = await this.userModel.findOne({
        identificationName: profileUpdateDto.identificationName,
        _id: { $ne: userId },
      });
      if (existingByIdentification) {
        throw new ConflictException('Identification name already used');
      }
      user.identificationName = profileUpdateDto.identificationName;
    }

    if (profileUpdateDto.firstName !== undefined) {
      user.firstName = profileUpdateDto.firstName.trim();
    }
    if (profileUpdateDto.middleName !== undefined) {
      user.middleName = profileUpdateDto.middleName.trim();
    }
    if (profileUpdateDto.lastName !== undefined) {
      user.lastName = profileUpdateDto.lastName.trim();
    }
    if (profileUpdateDto.birthday !== undefined) {
      user.birthday = profileUpdateDto.birthday;
    }
    if (profileUpdateDto.city !== undefined) {
      user.city = profileUpdateDto.city.trim();
    }
    if (profileUpdateDto.countryCode !== undefined) {
      user.countryCode = profileUpdateDto.countryCode;
    }
    if (avatarFile) {
      const avatarUpload = await this.uploadsService.uploadFileGeneral(avatarFile);
      user.profileImage = avatarUpload.path;
    }

    await user.save();
    return user;
  }

  async changeOwnPassword(
    userId: string,
    changePasswordDto: ChangePasswordRequestDto,
  ): Promise<Token> {
    const user = await this.findExistingUser(userId);

    const isValid = await this.hashingProvider.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await this.hashingProvider.compare(
      changePasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    user.password = await this.hashingProvider.hash(
      changePasswordDto.newPassword,
    );
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    return this.tokenGenerator.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.findExistingUser(userId);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
  }

  async updateByUniqe(
    uniqueFields: Partial<UniqueFields>,
    canBeUpdated: Partial<CanBeUpdated>,
  ): Promise<UserDocument | null> {
    const { params, canBeUpdatedParams } = this.buildUniqueParams(
      uniqueFields,
      canBeUpdated,
    );
    const updatedUser = await this.userModel.findOneAndUpdate(
      params,
      canBeUpdatedParams,
      { new: true },
    );
    if (!updatedUser) {
      return null;
    }
    return updatedUser;
  }

  private buildUniqueParams(
    uniqueFields: Partial<UniqueFields>,
    canBeUpdated: Partial<CanBeUpdated>,
  ) {
    const params = {};
    const canBeUpdatedParams = {};
    if (uniqueFields) {
      if (uniqueFields.id) {
        params['_id'] = uniqueFields.id;
      }
      if (uniqueFields.email) {
        params['email'] = uniqueFields.email;
      }
      if (uniqueFields.phoneNumber) {
        params['phoneNumber'] = uniqueFields.phoneNumber;
      }
      if (uniqueFields.identificationName) {
        params['identificationName'] = uniqueFields.identificationName;
      }
    }

    if (canBeUpdated) {
      if (canBeUpdated.role) {
        canBeUpdatedParams['$addToSet'] = { role: canBeUpdated.role };
      }
    }
    return { params, canBeUpdatedParams };
  }

  private async findExistingUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // async findByEmail(email: string): Promise<User | null> {
  //   return this.userModel.findOne({ where: { email } });
  // }

  async findByIdentificationName(
    identificationName: string,
  ): Promise<User | null> {
    return this.userModel.findOne({
      where: { identificationName: identificationName },
    });
  }

  // async addRoleIfNotExists(userId: string, role: RolesEnum): Promise<User> {
  //   const user = await this.userModel.findOne({ where: { id: userId } });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   if (!user.roles.includes(role)) {
  //     user.roles = [...user.roles, role];
  //     await this.userModel.save(user);
  //   }

  //   return user;
  // }
}
