import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  defaultCurrency?: string

  @IsOptional()
  @IsString()
  defaultLanguage?: string

  @IsOptional()
  @IsNumber()
  paymentDays?: number
}
