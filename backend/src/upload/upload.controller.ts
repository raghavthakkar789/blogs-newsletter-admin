import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UploadService } from './upload.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { memoryStorage } from 'multer';
import { UploadFolder } from './s3.service';

@Controller('upload')
@UseGuards(AuthGuard, ThrottlerGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10485760, // 10MB
      },
      fileFilter: (req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
        // Accept all image types
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only images are allowed.'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Determine folder from query parameter or default to blogs
    const uploadFolder = (folder === 'newsletters' ? 'newsletters' : 'blogs') as UploadFolder;

    // Use appropriate method based on folder
    if (uploadFolder === 'newsletters') {
      return await this.uploadService.uploadFileForNewsletters(file);
    } else {
      return await this.uploadService.uploadFileForBlogs(file);
    }
  }
}

