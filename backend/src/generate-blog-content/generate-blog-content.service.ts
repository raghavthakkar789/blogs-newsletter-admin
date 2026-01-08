import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GenerateBlogContentDto } from './dto/generate-blog-content.dto';
import { RegenerateBlogFieldDto } from './dto/regenerate-blog-field.dto';

@Injectable()
export class GenerateBlogContentService {
  private timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.timeout = parseInt(
      this.configService.get<string>('AI_WEBHOOK_TIMEOUT', '30000'),
    );
  }

  async generateContent(dto: GenerateBlogContentDto) {
    if (!dto.blogIdea?.trim() && !dto.blogAbout?.trim()) {
      throw new BadRequestException(
        "Please provide either a blog idea or what it's about",
      );
    }

    const webhookUrl = 'http://54.88.119.163:5679/webhook/http://localhost:5000/api/blogs';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          {
            blogIdea: dto.blogIdea || '',
            blogAbout: dto.blogAbout || '',
            audience: dto.audience || '',
            isCompanySpecific: dto.isCompanySpecific || false,
          },
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const title = response.data.title || response.data.Title;
      const content =
        response.data.contentHtml ||
        response.data.Content ||
        response.data.content;
      const summary = response.data.summary || response.data.Summary;
      const tags = response.data.tags || response.data.Tags;

      if (!title || !content) {
        throw new HttpException(
          'Invalid response from AI service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        title: title || 'Generated Blog Title',
        content: content || '',
        summary: summary || '',
        tags: tags || [],
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException('AI service timeout', HttpStatus.GATEWAY_TIMEOUT);
      }
      throw new HttpException(
        error.message || 'Failed to generate blog content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async regenerateField(dto: RegenerateBlogFieldDto) {
    let webhookUrl: string;

    if (dto.field === 'title') {
      webhookUrl = 'http://54.88.119.163:5679/webhook/a03946d5-0449-4156-89c8-36f2f021803c';
    } else if (dto.field === 'summary') {
      webhookUrl = 'http://54.88.119.163:5679/webhook/438b14c0-3bd6-4636-9831-a7bb3463c926';
    } else if (dto.field === 'content') {
      webhookUrl = 'http://54.88.119.163:5679/webhook-test/ddab5050-03cd-4d48-8a74-2b07e5d17e96';
    } else {
      const defaultWebhook = this.configService.get<string>('AI_WEBHOOK_URL');
      if (!defaultWebhook) {
        throw new HttpException(
          'AI content generation is not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      webhookUrl = defaultWebhook;
    }

    try {
      const payload =
        dto.field === 'title' || dto.field === 'summary' || dto.field === 'content'
          ? {
              prompt: dto.prompt,
              currentValue: dto.currentValue || '',
              field: dto.field,
              ...(dto.context || {}),
            }
          : {
              action: 'regenerate',
              field: dto.field,
              prompt: dto.prompt,
              currentValue: dto.currentValue || '',
              context: dto.context || {},
            };

      const response = await firstValueFrom(
        this.httpService.post(webhookUrl, payload, {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      let regeneratedValue: string;

      if (dto.field === 'title') {
        regeneratedValue =
          response.data.Title ||
          response.data.title ||
          response.data?.output?.[0]?.content?.[0]?.text ||
          response.data.value ||
          response.data.result;
      } else if (dto.field === 'summary') {
        regeneratedValue =
          response.data.Summary ||
          response.data.summary ||
          response.data?.output?.[0]?.content?.[0]?.text ||
          response.data.value ||
          response.data.result;
      } else if (dto.field === 'content') {
        regeneratedValue =
          response.data.Content ||
          response.data.contentHtml ||
          response.data.content ||
          response.data?.output?.[0]?.content?.[0]?.text ||
          response.data.value ||
          response.data.result;
      } else {
        regeneratedValue =
          response.data[dto.field] ||
          response.data.value ||
          response.data.result;
      }

      if (!regeneratedValue) {
        throw new HttpException(
          'Invalid response from AI service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        field: dto.field,
        value: regeneratedValue,
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException('AI service timeout', HttpStatus.GATEWAY_TIMEOUT);
      }
      throw new HttpException(
        error.message || 'Failed to regenerate blog field',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

