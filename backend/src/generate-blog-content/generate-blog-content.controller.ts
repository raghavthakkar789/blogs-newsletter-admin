import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GenerateBlogContentService } from './generate-blog-content.service';
import { GenerateBlogContentDto } from './dto/generate-blog-content.dto';
import { RegenerateBlogFieldDto } from './dto/regenerate-blog-field.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('generate-blog-content')
@UseGuards(AuthGuard, ThrottlerGuard)
export class GenerateBlogContentController {
  constructor(
    private readonly generateBlogContentService: GenerateBlogContentService,
  ) {}

  @Post()
  async generateContent(@Body() dto: GenerateBlogContentDto) {
    return await this.generateBlogContentService.generateContent(dto);
  }

  @Post('regenerate')
  async regenerateField(@Body() dto: RegenerateBlogFieldDto) {
    return await this.generateBlogContentService.regenerateField(dto);
  }
}

