import { PickType } from '@nestjs/swagger';
import { UserRequestDto } from './user.request.dto';

export class AdminRequestDto extends PickType(UserRequestDto, [
  'firstName',
  'middleName',
  'lastName',
  'identificationName',
  'email',
  'phoneNumber',
  'password',
  'birthday',
  'city',
  'countryCode',
]) {}
