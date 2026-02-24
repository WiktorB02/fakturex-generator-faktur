import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async get(companyId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id }
    })
    if (!warehouse || warehouse.companyId !== companyId) {
      throw new NotFoundException('Warehouse not found')
    }
    return warehouse
  }

  async create(companyId: string, dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        ...dto,
        companyId
      }
    })
  }

  async update(companyId: string, id: string, dto: UpdateWarehouseDto) {
    const warehouse = await this.get(companyId, id)
    return this.prisma.warehouse.update({
      where: { id: warehouse.id },
      data: dto
    })
  }

  async remove(companyId: string, id: string) {
    const warehouse = await this.get(companyId, id)
    return this.prisma.warehouse.delete({
      where: { id: warehouse.id }
    })
  }
}
