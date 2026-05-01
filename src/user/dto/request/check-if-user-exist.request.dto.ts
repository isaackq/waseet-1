import { PickType } from '@nestjs/swagger';
import { LogInDto } from 'src/auth/dto/request/login.request.dto';

export class CheckIfUserExistRequestDto extends PickType(LogInDto, ['email']) {}
