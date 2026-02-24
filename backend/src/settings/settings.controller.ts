import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { UpdateSettingsDto } from './dto/update-settings.dto'

@Controller('settings')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async get(@CompanyId() companyId: string) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId }
    })
    return settings || {}
  }

  @Patch()
  async update(@CompanyId() companyId: string, @Body() dto: UpdateSettingsDto) {
    return this.prisma.companySettings.upsert({
      where: { companyId },
      create: {
        companyId,
        defaultCurrency: dto.defaultCurrency as any || 'PLN',
        defaultLanguage: dto.defaultLanguage || 'pl',
        paymentDays: dto.paymentDays || 14
      },
      update: {
        defaultCurrency: dto.defaultCurrency as any,
        defaultLanguage: dto.defaultLanguage,
        paymentDays: dto.paymentDays
      }
    })
  }
}
