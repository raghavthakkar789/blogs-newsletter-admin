import { Module } from '@nestjs/common';
import { GenerateNewsletterContentController } from './generate-newsletter-content.controller';
import { GenerateNewsletterContentService } from './generate-newsletter-content.service';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.register({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }),
  ],
  controllers: [GenerateNewsletterContentController],
  providers: [GenerateNewsletterContentService],
})
export class GenerateNewsletterContentModule {}

