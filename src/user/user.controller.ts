import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Token } from 'src/auth/dto/response/token.response.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { AdminRequestDto } from './dto/request/admin.request.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.request.dto';
import { CheckIfUserExistRequestDto } from './dto/request/check-if-user-exist.request.dto';
import { GetUsersRequestDto } from './dto/request/get-users.request.dto';
import { UpdateProfileRequestDto } from './dto/request/update-profile.request.dto';
import { UserRequestDto } from './dto/request/user.request.dto';
import { UserResponseDto } from './dto/response/user.response.dto';
import { RolesEnum } from './enums/role.enum';
import { User, UserDocument } from './user.schema';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new user' })
  @ApiBody({ type: UserRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Roles([RolesEnum.ADMIN])
  @Post('create')
  async createUser(@Body(new ValidationPipe()) userRequestDto: UserRequestDto) {
    return await this.userService.createUser(userRequestDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'return user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User Returned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Roles([
    RolesEnum.ADMIN,
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
  ])
  @Get('me')
  async me(@CurrentUser() currentUser: User) {
    const user = await this.userService.findOne(currentUser.id);
    if (!user) {
      throw new NotFoundException();
    }
    return UserResponseDto.createFromDocument(user as UserDocument);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my user profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @Roles([
    RolesEnum.ADMIN,
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
  ])
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('me/profile')
  async updateMyProfile(
    @CurrentUser() currentUser: User,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @Body(new ValidationPipe({ skipUndefinedProperties: true }))
    profileUpdateDto: UpdateProfileRequestDto,
  ) {
    const user = await this.userService.updateOwnProfile(
      currentUser.id,
      profileUpdateDto,
      avatar,
    );
    return UserResponseDto.createFromDocument(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change my own user password' })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully and new tokens issued',
    type: Token,
  })
  @Roles([
    RolesEnum.ADMIN,
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
  ])
  @Patch('me/change-password')
  async changeOwnPassword(
    @CurrentUser() currentUser: User,
    @Body(new ValidationPipe())
    changePasswordDto: ChangePasswordRequestDto,
  ): Promise<Token> {
    return this.userService.changeOwnPassword(
      currentUser.id,
      changePasswordDto,
    );
  }

  @ApiOperation({ summary: 'Add a new admin' })
  @ApiBody({ type: AdminRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'admin created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Post('create-admin')
  async createAdmin(
    @Body(new ValidationPipe()) adminRequestDto: AdminRequestDto,
  ) {
    return await this.userService.createUser(adminRequestDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check user if exist in the system before start the session',
  })
  @ApiBody({ type: CheckIfUserExistRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'If true User Found If False User Not Found',
    type: Boolean,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Roles([RolesEnum.ADMIN, RolesEnum.USER, RolesEnum.FREELANCER])
  @Post('check-user')
  async checkIfUserExist(
    @Body(new ValidationPipe()) body: CheckIfUserExistRequestDto,
  ) {
    return (await this.userService.findOneByEmail(body.email)) ? true : false;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with optional date filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users returned successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Roles([RolesEnum.ADMIN])
  @Get('all')
  async findAllUsers(
    @Query(new ValidationPipe({ transform: true }))
    usersQuery: GetUsersRequestDto,
    @Req() request: Request,
  ) {
    return await this.userService.findAll(usersQuery, request);
  }
}
