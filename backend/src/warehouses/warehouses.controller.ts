import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { WarehousesService } from './warehouses.service'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('warehouses')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string) {
    return this.warehousesService.list(companyId)
  }

  @Get(':id')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  get(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.warehousesService.get(companyId, id)
  }

  @Post()
  @Roles('OWNER')
  create(@CompanyId() companyId: string, @Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(companyId, dto)
  }

  @Patch(':id')
  @Roles('OWNER')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(companyId, id, dto)
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.warehousesService.remove(companyId, id)
  }
}
