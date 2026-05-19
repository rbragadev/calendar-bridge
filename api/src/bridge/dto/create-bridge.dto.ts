import { IsString, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateBridgeDto {
  @IsString()
  sourceAccountId: string;

  @IsString()
  sourceCalendarId: string;

  @IsString()
  targetAccountId: string;

  @IsString()
  targetCalendarId: string;

  @IsOptional()
  @IsString()
  titleTemplate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  syncPastDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  syncFutureDays?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
