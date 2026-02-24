import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Unit } from '../../common/enums'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit

  @IsOptional()
  @IsNumber()
  priceNet?: number

  @IsOptional()
  @IsNumber()
  vatRate?: number

  @IsOptional()
  @IsNumber()
  stock?: number

  @IsOptional()
  @IsString()
  location?: string
}
