import { Module } from '@nestjs/common';
import { GenerateBlogContentController } from './generate-blog-content.controller';
import { GenerateBlogContentService } from './generate-blog-content.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [GenerateBlogContentController],
  providers: [GenerateBlogContentService],
})
export class GenerateBlogContentModule {}

