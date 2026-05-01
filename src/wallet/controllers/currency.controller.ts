import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { CurrencyRequestDto } from '../dto/currency/request/currency-request.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrencyResponseDto } from '../dto/currency/response/currency-respons.dto';
import { CurrencyService } from '../services/currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @ApiBearerAuth()
  @ApiBody({ type: CurrencyRequestDto })
  @ApiOperation({ summary: 'Add a new currency' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Currency created successfully',
    type: CurrencyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @Roles([RolesEnum.ADMIN])
  @Post('create')
  async createCurrency(
    @Body(new ValidationPipe()) currencyRequestDto: CurrencyRequestDto,
  ) {
    const currencyDocument = await this.currencyService.createCurrency(currencyRequestDto);
    return CurrencyResponseDto.createFromDocument(currencyDocument)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'finde all currency' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Currency retreived successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
  @Roles([RolesEnum.ADMIN])
  @Get('all')
  async findAll() {
    const currencyDocuments = await this.currencyService.findAll();
    return currencyDocuments.map((currencyDocument) =>
      CurrencyResponseDto.createFromDocument(currencyDocument),
    );
  }
}
