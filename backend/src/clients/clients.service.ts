import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string, nip?: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId, ...(nip ? { nip } : {}) },
      orderBy: { createdAt: 'desc' }
    })
    return clients.map(c => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : []
    }))
  }

  async addTags(companyId: string, id: string, tags: string[]) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } })
    const existing: string[] = client?.tags ? JSON.parse(client.tags) : []
    const next = Array.from(new Set([...existing, ...tags]))
    const updated = await this.prisma.client.update({ where: { id, companyId }, data: { tags: JSON.stringify(next) } })
    return { ...updated, tags: JSON.parse(updated.tags) }
  }

  async removeTags(companyId: string, id: string, tags: string[]) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } })
    const existing: string[] = client?.tags ? JSON.parse(client.tags) : []
    const next = existing.filter((tag) => !tags.includes(tag))
    const updated = await this.prisma.client.update({ where: { id, companyId }, data: { tags: JSON.stringify(next) } })
    return { ...updated, tags: JSON.parse(updated.tags) }
  }

  async create(companyId: string, dto: CreateClientDto) {
    const created = await this.prisma.client.create({ data: { ...dto, companyId, tags: JSON.stringify(dto.tags || []) } })
    return { ...created, tags: JSON.parse(created.tags) }
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    const data: any = { ...dto }
    if (dto.tags) {
      data.tags = JSON.stringify(dto.tags)
    }
    const updated = await this.prisma.client.update({ where: { id, companyId }, data })
    return { ...updated, tags: JSON.parse(updated.tags) }
  }

  remove(companyId: string, id: string) {
    return this.prisma.client.delete({ where: { id, companyId } })
  }
}
