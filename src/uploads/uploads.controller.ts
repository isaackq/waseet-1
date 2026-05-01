// import {
//   Body,
//   Controller,
//   Get,
//   HttpStatus,
//   Param,
//   Post,
//   Query,
//   UploadedFile,
//   UseInterceptors,
//   ValidationPipe,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import {
//   ApiBearerAuth,
//   ApiBody,
//   ApiConsumes,
//   ApiOperation,
//   ApiParam,
//   ApiQuery,
//   ApiResponse,
// } from '@nestjs/swagger';
// import { UploadsService } from './providers/uploads.service';
// import { CurrentUser } from 'src/decorators/current-user.decorator';
// import type { User } from 'src/interfaces/user.interface';
// import { AttachmentTypeEnum } from './entities/attachment.entity';
// import { UploadFileDto } from './Dto/upload-file.dto';
// import { Roles } from 'src/decorators/roles.decorator';
// import { UserIdCheckDto } from 'src/Dtos/id-check.dto';
// import { RolesEnum } from 'src/enums/roles.enum';

// @Controller('uploads')
// export class UploadsController {
//   constructor(private readonly uploadsService: UploadsService) {}

//   @ApiBearerAuth()
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         file: { type: 'string', format: 'binary' },
//         type: {
//           type: 'string',
//           enum: Object.values(AttachmentTypeEnum),
//           description: 'Document Type',
//         },
//       },
//       required: ['file', 'type'],
//     },
//   })
//   @UseInterceptors(FileInterceptor('file'))
//   // @ApiHeaders([
//   //   { name: 'content-type', description: 'multipart/form-data' },
//   //   { name: 'Authorization', description: 'Bearer token' },
//   // ]) //file is the name of the field in the form-data
//   @ApiOperation({ summary: 'Upload a file' })
//   @Roles([RolesEnum.GUARD, RolesEnum.INSPECTOR])
//   @Post('file')
//   async uploadFile(
//     @UploadedFile() file: Express.Multer.File,
//     @CurrentUser() user: User,
//     @Body(new ValidationPipe()) uploadFileDto: UploadFileDto,
//   ) {
//     return await this.uploadsService.uploadFile(file, user, uploadFileDto.type);
//   }
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Get attachment by type for current user' })
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: 'File retrieved successfully',
//   })
//   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
//   @ApiQuery({
//     name: 'type',
//     enum: AttachmentTypeEnum,
//     required: false,
//     description: 'type of attachment',
//   })
//   @Roles([RolesEnum.GUARD, RolesEnum.INSPECTOR])
//   @Get('my-attachment')
//   async getMyAttachment(
//     @Query('type') type: AttachmentTypeEnum,
//     @CurrentUser() user: User,
//   ) {
//     return await this.uploadsService.getFile(user, type);
//   }

//   @ApiBearerAuth()
//   @ApiResponse({
//     status: HttpStatus.OK,
//     description: 'File retrieved successfully',
//   })
//   @ApiOperation({ summary: 'Get attachment by type for user ID' })
//   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not Found' })
//   @ApiQuery({
//     name: 'type',
//     enum: AttachmentTypeEnum,
//     required: false,
//     description: 'type of attachment',
//   })
//   @ApiParam({ name: 'userID', type: String, description: 'User UUID v4' })
//   @Roles([RolesEnum.GUARD, RolesEnum.INSPECTOR, RolesEnum.ADMIN])
//   @Get('attachment/:userID')
//   async getById(
//     @Param() param: UserIdCheckDto,
//     @Query('type') type: AttachmentTypeEnum,
//   ) {
//     return await this.uploadsService.getFileByUserId(param.userID, type);
//   }
// }
