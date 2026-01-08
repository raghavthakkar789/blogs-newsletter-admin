import { Module } from '@nestjs/common';
import { GenerateNewsletterContentController } from './generate-newsletter-content.controller';
import { GenerateNewsletterContentService } from './generate-newsletter-content.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [GenerateNewsletterContentController],
  providers: [GenerateNewsletterContentService],
})
export class GenerateNewsletterContentModule {}

