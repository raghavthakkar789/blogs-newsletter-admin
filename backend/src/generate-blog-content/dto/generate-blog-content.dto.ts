import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class GenerateBlogContentDto {
  @IsString()
  @IsOptional()
  blogIdea?: string;

  @IsString()
  @IsOptional()
  blogAbout?: string;

  @IsString()
  @IsOptional()
  audience?: string;

  @IsBoolean()
  @IsOptional()
  isCompanySpecific?: boolean;
}

