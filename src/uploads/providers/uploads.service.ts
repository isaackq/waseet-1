import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UploadToAwsProvider } from './uplode-to-aws.provider';
import { Upload, UploadDocument } from '../schema/upload.schema';
import { fileTypesEnum } from '../enums/file-type.enum';
import { MAX_FILE_SIZES, MIME_TYPE_CONFIG } from '../config/mime-types.config';

@Injectable()
export class UploadsService {
  constructor(
    @InjectModel(Upload.name)
    private readonly uploadRepo: Model<UploadDocument>,
    private readonly uploadToAwsProvider: UploadToAwsProvider,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Classify file type based on MIME type
   */
  private classifyFileType(mimeType: string): fileTypesEnum {
    // Check each category
    for (const [fileType, mimeTypes] of Object.entries(MIME_TYPE_CONFIG)) {
      if (mimeTypes.includes(mimeType)) {
        return fileType as fileTypesEnum;
      }
    }

    throw new BadRequestException(
      `Unsupported file type: ${mimeType}. Please upload a valid file.`,
    );
  }

  /**
   * Validate file MIME type is supported
   */
  private validateMimeType(mimeType: string): void {
    const allSupportedMimeTypes = Object.values(MIME_TYPE_CONFIG).flat();

    if (!allSupportedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `MIME type "${mimeType}" is not supported. Supported types: ${this.getSupportedFileTypesMessage()}`,
      );
    }
  }

  /**
   * Validate file size based on type
   */
  private validateFileSize(fileSize: number, fileType: fileTypesEnum): void {
    const maxSize = MAX_FILE_SIZES[fileType];

    if (fileSize > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB} MB for ${fileType} files.`,
      );
    }
  }

  /**
   * Get human-readable supported file types message
   */
  private getSupportedFileTypesMessage(): string {
    return `
      Images: JPEG, PNG, GIF, WebP, SVG
      Documents: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX), Text files
      Archives: ZIP, RAR, 7Z, TAR, GZIP
      Videos: MP4, MOV, AVI, WebM, MKV
      Audio: MP3, WAV, OGG, AAC, FLAC
    `;
  }

  /**
   * Upload file with automatic type classification
   * @param file - Multer file object
   * @returns Upload document
   */
  public async uploadFileGeneral(
    file: Express.Multer.File,
  ): Promise<UploadDocument> {
    // 1. Validate MIME type is supported
    this.validateMimeType(file.mimetype);

    // 2. Classify file type based on MIME type
    const fileType = this.classifyFileType(file.mimetype);

    // 3. Validate file size based on type
    this.validateFileSize(file.size, fileType);

    // 4. Upload to AWS
    let upload: UploadDocument;
    try {
      const fileName = await this.uploadToAwsProvider.uploadFile(file);

      const uploadFile: UploadDocument = new this.uploadRepo({
        name: fileName,
        path: `https://${this.configService.get('appConfig.awsCloudfrontUrl')}/${fileName}`,
        type: fileType,
        mime: file.mimetype,
        size: file.size,
      });

      upload = await uploadFile.save();
    } catch (error) {
      throw new ConflictException(`Failed to upload file: ${error.message}`);
    }

    return upload;
  }

  /**
   * Upload file with manual type specification (backward compatibility)
   * @param file - Multer file object
   * @param type - Manually specified file type
   * @returns Upload document
   */
  public async uploadFileWithType(
    file: Express.Multer.File,
    type: fileTypesEnum,
  ): Promise<UploadDocument> {
    // Validate that the manual type matches the MIME type
    const detectedType = this.classifyFileType(file.mimetype);

    if (detectedType !== type) {
      throw new BadRequestException(
        `Manual type "${type}" does not match detected type "${detectedType}".`,
      );
    }

    // Use the general upload function
    return this.uploadFileGeneral(file);
  }

  /**
   * Get file information by ID
   */
  public async getFileById(fileId: string): Promise<UploadDocument | null> {
    return this.uploadRepo.findById(fileId).exec();
  }

  /**
   * Delete file from database and storage
   */
  public async deleteFile(fileId: string): Promise<void> {
    const file = await this.uploadRepo.findById(fileId).exec();

    if (!file) {
      throw new BadRequestException('File not found');
    }

    // // Delete from AWS   //error needed to be handle from aws console
    // try {
    //   await this.uploadToAwsProvider.deleteFile(file.name);
    // } catch (error) {
    //   throw new ConflictException(`Failed to delete file from AWS: ${error.message}`);
    // }

    // Delete from database
    await this.uploadRepo.findByIdAndDelete(fileId).exec();
  }

  /**
   * Check if MIME type is supported
   */
  public isMimeTypeSupported(mimeType: string): boolean {
    const allSupportedMimeTypes = Object.values(MIME_TYPE_CONFIG).flat();
    return allSupportedMimeTypes.includes(mimeType);
  }

  /**
   * Get file type from MIME type
   */
  public getFileTypeFromMimeType(mimeType: string): fileTypesEnum | null {
    try {
      return this.classifyFileType(mimeType);
    } catch {
      return null;
    }
  }
}

// import {
//   BadRequestException,
//   ConflictException,
//   Injectable,
// } from '@nestjs/common';
// import { UploadToAwsProvider } from './uplode-to-aws.provider';
// import { ConfigService } from '@nestjs/config';
// import { fileTypesEnum } from '../enums/file-type.enum';
// import { User } from 'src/user/user.schema';
// import { Model } from 'mongoose';
// import { Upload, UploadDocument } from '../schema/upload.schema';
// import { InjectModel } from '@nestjs/mongoose';

// @Injectable()
// export class UploadsService {
//   constructor(
//     @InjectModel(Upload.name)
//     private readonly uploadRepo: Model<Upload>,
//     private readonly uploadToAwsProvider: UploadToAwsProvider,
//     private readonly configService: ConfigService,
//   ) {}
//   // public async uploadFile(
//   //   file: Express.Multer.File,
//   //   user: User,
//   //   type: AttachmentTypeEnum,
//   // ) {
//   //   // throw error for unsupported MIME types
//   //   if (
//   //     !['image/gif', 'image/jpeg', 'image/jpg', 'image/png'].includes(
//   //       file.mimetype,
//   //     )
//   //   ) {
//   //     throw new BadRequestException('Mime type not supported');
//   //   }

//   //   let upload;
//   //   try {
//   //     const name = await this.uploadToAwsProvider.uploadFile(file);
//   //     const uploadFile = {
//   //       name: name,
//   //       path: `https://${this.configService.get('appConfig.awsCloudfrontUrl')}/${name}`,
//   //       type: fileTypesEnum.IMAGE,
//   //       mime: file.mimetype,
//   //       size: file.size,
//   //     };

//   //     upload = await this.uploadRepo.create(uploadFile);
//   //   } catch (error) {
//   //     throw new ConflictException(error);
//   //   }
//   //   return upload;
//   // }

//   public async uploadFileGeneral(
//     file: Express.Multer.File,
//     type: fileTypesEnum,
//   ): Promise<UploadDocument> {
//     // throw error for unsupported MIME types
//     if (
//       !['image/gif', 'image/jpeg', 'image/jpg', 'image/png'].includes(
//         file.mimetype,
//       )
//     ) {
//       throw new BadRequestException('Mime type not supported');
//     }

//     let upload: UploadDocument;
//     try {
//       const name = await this.uploadToAwsProvider.uploadFile(file);
//       const uploadFile: UploadDocument = new this.uploadRepo({
//         name: name,
//         path: `https://${this.configService.get('appConfig.awsCloudfrontUrl')}/${name}`,
//         type: type,
//         mime: file.mimetype,
//         size: file.size,
//       });

//       upload = await uploadFile.save();
//     } catch (error) {
//       throw new ConflictException(error);
//     }
//     return upload;
//   }
// }
