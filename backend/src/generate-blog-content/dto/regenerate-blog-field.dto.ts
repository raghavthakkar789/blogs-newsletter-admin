import { IsEnum, IsString, IsOptional, IsObject, MinLength } from 'class-validator';

export enum BlogField {
  TITLE = 'title',
  SUMMARY = 'summary',
  CONTENT = 'content',
  TAGS = 'tags',
  IMAGE = 'image',
}

export class RegenerateBlogFieldDto {
  @IsEnum(BlogField)
  field: BlogField;

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
    author?: string;
  };
}

