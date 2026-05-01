import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadToAwsProvider {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('appConfig.awsRegion') as string,
      credentials: {
        accessKeyId: this.configService.get<string>(
          'appConfig.awsAccessKeyId',
        ) as string,
        secretAccessKey: this.configService.get<string>(
          'appConfig.awsSecretAccessKey',
        ) as string,
      },
    });
  }

  public async uploadFile(file: Express.Multer.File) {
    try {
      const key = this.generateFileKey(file);

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.configService.get('appConfig.awsBucketName'),
          Key: key,
          Body: file.buffer, // نفس منطقك
          ContentType: file.mimetype,
        }),
      );

      return key;
    } catch (error) {
      throw new RequestTimeoutException(error);
    }
  }

  public async deleteFile(key: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.configService.get('appConfig.awsBucketName'),
          Key: key,
        }),
      );
    } catch (error) {
      throw new RequestTimeoutException(error);
    }
  }

  private generateFileKey(file: Express.Multer.File) {
    let name = file.originalname.split('.')[0];
    name = name.replace(/\s/g, '');

    const extension = path.extname(file.originalname);
    const timestamp = Date.now().toString();

    return `${name}-${timestamp}-${uuidv4()}${extension}`;
  }
}
