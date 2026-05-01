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
import { CreateFeeRequestDto } from '../dto/fee/request/create-fee.request.dto';
import { UpdateFeeRequestDto } from '../dto/fee/request/update-fee.request.dto';
import { FeeService } from '../services/fee.service';

@ApiTags('Fee')
@ApiBearerAuth()
@Controller('fee')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // @ApiOperation({ summary: 'Create fee (Admin)' })
  // @ApiBody({ type: CreateFeeRequestDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Fee created successfully' })
  // @Roles([RolesEnum.ADMIN])
  // @Post('create')
  // async create(@Body(new ValidationPipe()) createFeeDto: CreateFeeRequestDto) {
  //   const fee = await this.feeService.create(createFeeDto);
  //   return { message: 'Fee created successfully', fee };
  // }

  @ApiOperation({ summary: 'Get all fees (Admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fees retrieved successfully',
  })
  @Roles([RolesEnum.ADMIN])
  @Get('all')
  async findAll() {
    const fees = await this.feeService.findAll();
    return { count: fees.length, fees };
  }

  @ApiOperation({ summary: 'Get fee by id (Admin)' })
  @ApiParam({ name: 'id', description: 'Fee ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee retrieved successfully',
  })
  @Roles([RolesEnum.ADMIN])
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const fee = await this.feeService.findOne(id);
    return { fee };
  }

  // @ApiOperation({ summary: 'Update fee (Admin)' })
  // @ApiParam({ name: 'id', description: 'Fee ID' })
  // @ApiBody({ type: UpdateFeeRequestDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Fee updated successfully' })
  // @Roles([RolesEnum.ADMIN])
  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body(new ValidationPipe()) updateFeeDto: UpdateFeeRequestDto,
  // ) {
  //   const fee = await this.feeService.update(id, updateFeeDto);
  //   return { message: 'Fee updated successfully', fee };
  // }

  // @ApiOperation({ summary: 'Delete fee (Admin)' })
  // @ApiParam({ name: 'id', description: 'Fee ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Fee deleted successfully' })
  // @Roles([RolesEnum.ADMIN])
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   await this.feeService.remove(id);
  //   return { message: 'Fee deleted successfully' };
  // }
}
