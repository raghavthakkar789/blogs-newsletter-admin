import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GenerateNewsletterContentService } from './generate-newsletter-content.service';
import { GenerateNewsletterContentDto } from './dto/generate-newsletter-content.dto';
import { RegenerateNewsletterFieldDto } from './dto/regenerate-newsletter-field.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('generate-newsletter-content')
@UseGuards(AuthGuard, ThrottlerGuard)
export class GenerateNewsletterContentController {
  constructor(
    private readonly generateNewsletterContentService: GenerateNewsletterContentService,
  ) {}

  @Post()
  async generateContent(@Body() dto: GenerateNewsletterContentDto) {
    return await this.generateNewsletterContentService.generateContent(dto);
  }

  @Post('regenerate')
  async regenerateField(@Body() dto: RegenerateNewsletterFieldDto) {
    return await this.generateNewsletterContentService.regenerateField(dto);
  }
}

