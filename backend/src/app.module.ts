import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

import { DatabaseModule } from './database/database.module';
import { BlogsModule } from './blogs/blogs.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadModule } from './upload/upload.module';
import { GenerateBlogContentModule } from './generate-blog-content/generate-blog-content.module';
import { GenerateNewsletterContentModule } from './generate-newsletter-content/generate-newsletter-content.module';
import { HealthController } from './health/health.controller';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 15 * 60 * 1000, // 15 minutes
      limit: 100, // 100 requests
    }]),
    
    // Static file serving
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
      serveRoot: '/uploads',
    }),
    
    // Feature modules
    DatabaseModule,
    BlogsModule,
    NewslettersModule,
    AnalyticsModule,
    UploadModule,
    GenerateBlogContentModule,
    GenerateNewsletterContentModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

