import { Module } from '@nestjs/common';
import { UploadsService } from './providers/uploads.service';
import { UploadToAwsProvider } from './providers/uplode-to-aws.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Upload, UploadSchema } from './schema/upload.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Upload.name,
        schema: UploadSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [UploadsService, UploadToAwsProvider],
  exports: [UploadsService],
})
export class UploadsModule {}
