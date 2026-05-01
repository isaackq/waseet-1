export const MIME_TYPE_CONFIG = {
  // Images
  IMAGE: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],

  // ZIP and Archives
  ZIP: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ],

  // PDF
  PDF: ['application/pdf'],

  // Documents
  DOCUMENT: [
    // Microsoft Word
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

    // Microsoft Excel
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

    // Microsoft PowerPoint
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

    // Text files
    'text/plain', // .txt
    'text/csv', // .csv
    'text/html', // .html
    'text/markdown', // .md

    // Rich Text
    'application/rtf', // .rtf

    // OpenDocument formats
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'application/vnd.oasis.opendocument.presentation', // .odp
  ],

  // Videos
  VIDEO: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-ms-wmv', // .wmv
    'video/webm',
    'video/x-flv', // .flv
    'video/3gpp', // .3gp
    'video/x-matroska', // .mkv
  ],

  // Audio
  AUDIO: [
    'audio/mpeg', // .mp3
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
    'audio/mp4',
  ],
};

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  ZIP: 100 * 1024 * 1024, // 100 MB
  PDF: 20 * 1024 * 1024, // 20 MB
  DOCUMENT: 20 * 1024 * 1024, // 20 MB
  VIDEO: 500 * 1024 * 1024, // 500 MB
  AUDIO: 50 * 1024 * 1024, // 50 MB
};
