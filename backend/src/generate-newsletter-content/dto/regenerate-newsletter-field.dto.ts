import { IsEnum, IsString, IsOptional, IsObject, MinLength } from 'class-validator';

export enum NewsletterField {
  TITLE = 'title',
  SUMMARY = 'summary',
  CONTENT = 'content',
  TAGS = 'tags',
  IMAGE = 'image',
}

export class RegenerateNewsletterFieldDto {
  @IsEnum(NewsletterField)
  field: NewsletterField;

  @IsString()
  @MinLength(1, { message: 'Prompt is required' })
  prompt: string;

  @IsString()
  @IsOptional()
  currentValue?: string;

  @IsObject()
  @IsOptional()
  context?: {
    title?: string;
    summary?: string;
    content?: string;
    tags?: string[];
  };
}

