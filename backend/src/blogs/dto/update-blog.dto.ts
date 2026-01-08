import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogDto } from './create-blog.dto';
import { IsOptional, IsUrl } from 'class-validator';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @IsUrl({}, { message: 'Invalid image URL' })
  @IsOptional()
  image?: string;
}

