import { IsString, IsOptional, IsArray, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200, { message: 'Title must be less than 200 characters' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Content is required' })
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Summary must be less than 500 characters' })
  summary?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  author?: string;

  @IsUrl({}, { message: 'Invalid image URL' })
  @IsOptional()
  image?: string;
}

