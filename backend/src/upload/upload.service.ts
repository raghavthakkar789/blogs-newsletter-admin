import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FileUploadDto } from './dto/file-upload.dto';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type - accept all image types
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Sanitize filename
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const filename = `${timestamp}-${name}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Save file
    fs.writeFileSync(filepath, file.buffer);

    // Return file URL (relative path)
    const fileUrl = `/uploads/${filename}`;

    return {
      url: fileUrl,
      filename: filename,
    };
  }
}

