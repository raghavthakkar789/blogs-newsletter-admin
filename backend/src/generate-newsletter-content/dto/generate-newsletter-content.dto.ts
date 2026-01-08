import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class GenerateNewsletterContentDto {
  @IsString()
  @IsOptional()
  newsletterIdea?: string;

  @IsString()
  @IsOptional()
  newsletterAbout?: string;

  @IsString()
  @IsOptional()
  audience?: string;

  @IsBoolean()
  @IsOptional()
  isCompanySpecific?: boolean;
}

