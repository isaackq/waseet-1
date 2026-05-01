import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from 'src/user/enums/role.enum';
import { UserDocument } from 'src/user/user.schema';

export class UserResponseDto {
  @ApiProperty({
    example: '6811eb6339f4f1f0ac8db2a1',
    description: 'Unique user id',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'isaac',
    description: 'first name of the user',
    required: true,
    type: String,
  })
  firstName: string;

  @ApiProperty({
    example: 'kamel',
    description: 'middle name of the user',
    required: true,
    type: String,
  })
  middleName: string;

  @ApiProperty({
    example: 'eqdaih',
    description: 'last name of the user',
    required: true,
    type: String,
  })
  lastName: string;

  @ApiProperty({
    example: 'isaac-kamel',
    description: 'uniqe identification for the user',
    required: true,
    type: String,
  })
  identificationName: string;

  @ApiProperty({
    example: 'isaac@gmail.com',
    description: 'email of the user',
    required: true,
    type: String,
  })
  email: string;

  @ApiProperty({
    example: '+972597641331',
    description: 'phone number of the user',
    required: true,
    type: String,
  })
  phoneNumber: string;

  @ApiProperty({
    example: '1999-12-13',
    description: 'The birthday of the User',
    required: true,
    type: Date,
  })
  birthday: Date;

  @ApiProperty({
    example: 'Admin',
    description: 'Array Of User Roles',
    required: true,
    type: Array,
  })
  role: RolesEnum[];

  @ApiProperty({
    example: 'Gaza',
    description: 'The country address of the user',
    required: true,
    type: String,
  })
  city: string;

  @ApiProperty({
    type: String,
    description: 'Country code in ISO 3166-1 alpha-2 format',
    example: 'US',
    required: true,
  })
  countryCode: string;

  @ApiProperty({
    example: 'https://cdn.example.com/profile.png',
    description: 'User profile image',
    required: false,
    nullable: true,
    type: String,
  })
  profileImage?: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the user account is active',
    required: true,
    type: Boolean,
  })
  isActive: boolean;

  static createFromDocument(userDocument: UserDocument): UserResponseDto {
    const userResponse = new UserResponseDto();
    userResponse.id = userDocument.id;
    userResponse.firstName = userDocument.firstName;
    userResponse.middleName = userDocument.middleName;
    userResponse.lastName = userDocument.lastName;
    userResponse.identificationName = userDocument.identificationName;
    userResponse.email = userDocument.email;
    userResponse.phoneNumber = userDocument.phoneNumber;
    userResponse.birthday = userDocument.birthday;
    userResponse.city = userDocument.city;
    userResponse.role = userDocument.role;
    userResponse.countryCode = userDocument.countryCode;
    userResponse.profileImage = userDocument.profileImage ?? null;
    userResponse.isActive = userDocument.isActive ?? true;
    return userResponse;
  }
}
