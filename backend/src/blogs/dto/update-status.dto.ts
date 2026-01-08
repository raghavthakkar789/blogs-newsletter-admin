import { IsEnum } from 'class-validator';

export enum ContentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export class UpdateStatusDto {
  @IsEnum(ContentStatus)
  status: ContentStatus;
}

