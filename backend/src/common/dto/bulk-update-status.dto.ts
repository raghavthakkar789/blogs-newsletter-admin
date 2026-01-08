import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';

export enum BulkStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class BulkUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one id is required' })
  @IsUUID('4', { each: true })
  ids: string[];

  @IsEnum(BulkStatus)
  status: BulkStatus;
}

