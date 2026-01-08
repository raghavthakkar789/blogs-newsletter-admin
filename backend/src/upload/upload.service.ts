import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service, UploadFolder } from './s3.service';

@Injectable()
export class UploadService {
  constructor(private s3Service: S3Service) {}

  /**
   * Upload file to S3 for blogs
   */
  async uploadFileForBlogs(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    return await this.s3Service.uploadFile(file, 'blogs');
  }

  /**
   * Upload file to S3 for newsletters
   */
  async uploadFileForNewsletters(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    return await this.s3Service.uploadFile(file, 'newsletters');
  }

  /**
   * Upload file to S3 (generic - requires folder parameter)
   * @deprecated Use uploadFileForBlogs or uploadFileForNewsletters instead
   */
  async uploadFile(file: Express.Multer.File, folder?: UploadFolder): Promise<{ url: string; filename: string }> {
    if (!folder) {
      throw new BadRequestException('Folder type is required. Use uploadFileForBlogs or uploadFileForNewsletters.');
    }
    return await this.s3Service.uploadFile(file, folder);
  }
}

