import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { MIME_TYPE_CONFIG, MAX_FILE_SIZES } from '../config/mime-types.config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check if MIME type is supported
    const allSupportedMimeTypes = Object.values(MIME_TYPE_CONFIG).flat();
    if (!allSupportedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not supported`,
      );
    }

    // Check file size based on type
    const fileType = this.getFileType(file.mimetype);
    const maxSize = MAX_FILE_SIZES[fileType];

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds ${maxSizeMB} MB limit for ${fileType} files`,
      );
    }

    return file;
  }

  private getFileType(mimeType: string): string {
    for (const [fileType, mimeTypes] of Object.entries(MIME_TYPE_CONFIG)) {
      //Object.entries returns iterable array of key–value pairs
      if (mimeTypes.includes(mimeType)) {
        return fileType;
      }
    }
    return 'DOCUMENT'; // default
  }
}
