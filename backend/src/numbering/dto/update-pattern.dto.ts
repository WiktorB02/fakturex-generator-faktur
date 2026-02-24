import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { InvoiceType, ResetPeriod } from '../../common/enums'

export class UpdatePatternDto {
  @IsEnum(InvoiceType)
  type!: InvoiceType

  @IsString()
  pattern!: string

  @IsInt()
  @Min(1)
  padding!: number

  @IsEnum(ResetPeriod)
  reset!: ResetPeriod
}
