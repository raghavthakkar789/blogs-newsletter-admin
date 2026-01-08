import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GenerateNewsletterContentDto } from './dto/generate-newsletter-content.dto';
import { RegenerateNewsletterFieldDto } from './dto/regenerate-newsletter-field.dto';

@Injectable()
export class GenerateNewsletterContentService {
  private timeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.timeout = parseInt(
      this.configService.get<string>('AI_WEBHOOK_TIMEOUT', '30000'),
    );
  }

  async generateContent(dto: GenerateNewsletterContentDto) {
    if (!dto.newsletterIdea?.trim() && !dto.newsletterAbout?.trim()) {
      throw new BadRequestException(
        "Please provide either a newsletter idea or what it's about",
      );
    }

    const webhookUrl = 'http://54.88.119.163:5679/webhook/http://localhost:5000/api/newsletters';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          {
            newsletterIdea: dto.newsletterIdea || '',
            newsletterAbout: dto.newsletterAbout || '',
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
        title: title || 'Generated Newsletter Title',
        content: content || '',
        summary: summary || '',
        tags: tags || [],
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new HttpException('AI service timeout', HttpStatus.GATEWAY_TIMEOUT);
      }
      throw new HttpException(
        error.message || 'Failed to generate newsletter content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async regenerateField(dto: RegenerateNewsletterFieldDto) {
    let webhookUrl: string;

    if (dto.field === 'title') {
      webhookUrl = 'http://54.88.119.163:5679/webhook/90c40868-aa5f-4e20-bd83-596f95af9d6a';
    } else if (dto.field === 'summary') {
      webhookUrl = 'http://54.88.119.163:5679/webhook/4b95e8d4-de01-4eda-a028-44509d9f729b';
    } else if (dto.field === 'content') {
      webhookUrl = 'http://54.88.119.163:5679/webhook/587acc62-5c71-4c3d-8432-89cc47caa751';
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
        error.message || 'Failed to regenerate newsletter field',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

