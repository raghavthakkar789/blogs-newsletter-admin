import { Module } from '@nestjs/common';
import { GenerateBlogContentController } from './generate-blog-content.controller';
import { GenerateBlogContentService } from './generate-blog-content.service';
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
  controllers: [GenerateBlogContentController],
  providers: [GenerateBlogContentService],
})
export class GenerateBlogContentModule {}

