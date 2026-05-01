import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { CreateHoldRequestDto } from '../dto/hold/request/create-hold.request.dto';
import { UpdateHoldRequestDto } from '../dto/hold/request/update-hold.request.dto';
import { HoldService } from '../services/hold.service';

@ApiTags('Hold')
@ApiBearerAuth()
@Controller('hold')
export class HoldController {
  constructor(private readonly holdService: HoldService) {}

  // @ApiOperation({ summary: 'Create hold (Admin)' })
  // @ApiBody({ type: CreateHoldRequestDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Hold created successfully' })
  // @Roles([RolesEnum.ADMIN])
  // @Post('create')
  // async create(@Body(new ValidationPipe()) createHoldDto: CreateHoldRequestDto) {
  //   const hold = await this.holdService.create(createHoldDto);
  //   return { message: 'Hold created successfully', hold };
  // }

  @ApiOperation({ summary: 'Get all holds (Admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Holds retrieved successfully',
  })
  @Roles([RolesEnum.ADMIN])
  @Get('all')
  async findAll() {
    const holds = await this.holdService.findAll();
    return { count: holds.length, holds };
  }

  @ApiOperation({ summary: 'Get hold by id (Admin)' })
  @ApiParam({ name: 'id', description: 'Hold ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hold retrieved successfully',
  })
  @Roles([RolesEnum.ADMIN])
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const hold = await this.holdService.findOne(id);
    return { hold };
  }

  // @ApiOperation({ summary: 'Update hold (Admin)' })
  // @ApiParam({ name: 'id', description: 'Hold ID' })
  // @ApiBody({ type: UpdateHoldRequestDto })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Hold updated successfully',
  // })
  // @Roles([RolesEnum.ADMIN])
  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body(new ValidationPipe()) updateHoldDto: UpdateHoldRequestDto,
  // ) {
  //   const hold = await this.holdService.update(id, updateHoldDto);
  //   return { message: 'Hold updated successfully', hold };
  // }

  // @ApiOperation({ summary: 'Delete hold (Admin)' })
  // @ApiParam({ name: 'id', description: 'Hold ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Hold deleted successfully',
  // })
  // @Roles([RolesEnum.ADMIN])
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   await this.holdService.remove(id);
  //   return { message: 'Hold deleted successfully' };
  // }
}
