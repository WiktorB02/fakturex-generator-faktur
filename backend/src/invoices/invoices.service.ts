import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { CreateCorrectionDto } from './dto/create-correction.dto'
import { NumberingService } from '../numbering/numbering.service'
import { UpdateInvoiceDto } from './dto/update-invoice.dto'

const calcTotals = (type: string, items: CreateInvoiceDto['items']) => {
  let totalNet = 0
  let totalVat = 0
  let totalGross = 0

  const normalizedItems = items.map((item) => {
    const discount = Number(item.discount ?? 0)
    const qty = Number(item.quantity)
    const priceNet = Number(item.priceNet)
    const net = qty * priceNet * (1 - discount / 100)
    const vatRate = type === 'NO_VAT' ? 0 : Number(item.vatRate)
    const vat = net * (vatRate / 100)
    const gross = net + vat
    totalNet += net
    totalVat += vat
    totalGross += gross
    return { ...item, vatRate }
  })

  return {
    items: normalizedItems,
    totals: {
      totalNet: Number(totalNet.toFixed(2)),
      totalVat: Number(totalVat.toFixed(2)),
      totalGross: Number(totalGross.toFixed(2))
    }
  }
}

const mapInvoiceItemsToDto = (items: any[]) =>
  items.map((item) => ({
    productId: item.productId ?? undefined,
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    priceNet: Number(item.priceNet),
    vatRate: Number(item.vatRate),
    discount: Number(item.discount ?? 0)
  }))

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService, private numberingService: NumberingService) {}

  list(companyId: string, type?: string, clientId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
        ...(type ? { type: type as any } : {}),
        ...(clientId ? { clientId } : {})
      },
      include: { items: true, client: true },
      orderBy: { issueDate: 'desc' }
    })
  }

  async get(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: { items: true, client: true }
    })
    if (!invoice) throw new NotFoundException('Nie znaleziono faktury')
    return invoice
  }

  createAdvance(companyId: string, dto: CreateInvoiceDto) {
    return this.create(companyId, { ...dto, type: 'ADVANCE' })
  }

  async duplicate(companyId: string, id: string, number: string) {
    const original = await this.get(companyId, id)
    const items = mapInvoiceItemsToDto(original.items)
    const { items: normalizedItems, totals } = calcTotals(original.type, items)

    return this.prisma.invoice.create({
      data: {
        companyId,
        clientId: original.clientId,
        type: original.type,
        number,
        issueDate: new Date(),
        saleDate: new Date(),
        dueDate: original.dueDate,
        currency: original.currency,
        language: original.language,
        notes: original.notes,
        issuerName: original.issuerName,
        issuerNip: original.issuerNip,
        issuerAddr: original.issuerAddr,
        totalNet: totals.totalNet,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        duplicateOfId: original.id,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            priceNet: item.priceNet,
            vatRate: item.vatRate,
            discount: item.discount ?? 0
          }))
        }
      }
    })
  }

  async createCorrection(companyId: string, id: string, dto: CreateCorrectionDto) {
    const original = await this.get(companyId, id)
    const baseItems = mapInvoiceItemsToDto(original.items)

    const items = dto.items?.length
      ? dto.items.map((item, index) => ({
          ...baseItems[index],
          ...item,
          quantity: Number(item.quantity ?? baseItems[index]?.quantity ?? 0),
          priceNet: Number(item.priceNet ?? baseItems[index]?.priceNet ?? 0),
          vatRate: Number(item.vatRate ?? baseItems[index]?.vatRate ?? 0),
          discount: Number(item.discount ?? baseItems[index]?.discount ?? 0)
        }))
      : baseItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity) * -1
        }))

    const { items: normalizedItems, totals } = calcTotals('CORRECTION', items as any)

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          clientId: original.clientId,
          type: 'CORRECTION',
          number: dto.number,
          issueDate: new Date(dto.issueDate),
          saleDate: new Date(dto.saleDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          currency: original.currency,
          language: original.language,
          notes: dto.notes,
          issuerName: original.issuerName,
          issuerNip: original.issuerNip,
          issuerAddr: original.issuerAddr,
          totalNet: totals.totalNet,
          totalVat: totals.totalVat,
          totalGross: totals.totalGross,
          correctionOfId: original.id,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId ?? null,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              priceNet: item.priceNet,
              vatRate: item.vatRate,
              discount: item.discount ?? 0
            }))
          }
        }
      })

      // Update stock for correction
      for (const item of normalizedItems) {
        if (item.productId) {
          // Decrement by the quantity on the correction.
          // If correction has -2, we decrement -2 (which adds 2 to stock).
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: Number(item.quantity) } }
          })
        }
      }

      return invoice
    })
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const number = dto.number?.trim()
      ? dto.number
      : await this.numberingService.next(companyId, dto.type, new Date(dto.issueDate))
    const { items, totals } = calcTotals(dto.type, dto.items)

    // Validation: Check stock for INVOICE, RECEIPT, NO_VAT
    if (['INVOICE', 'RECEIPT', 'NO_VAT'].includes(dto.type)) {
      for (const item of items) {
        if (item.productId && item.unit !== 'HOUR') {
           const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
           if (!product) continue; // Should probably throw, but let's be safe
           if (product.stock < Number(item.quantity)) {
             throw new BadRequestException(`Niewystarczający stan magazynowy dla produktu: ${item.name}. Dostępne: ${product.stock}, Wymagane: ${item.quantity}`);
           }
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          clientId: dto.clientId ?? null,
          type: dto.type,
          number,
          issueDate: new Date(dto.issueDate),
          saleDate: new Date(dto.saleDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          currency: dto.currency,
          exchangeRate: dto.exchangeRate ?? null,
          exchangeDate: dto.exchangeDate ? new Date(dto.exchangeDate) : null,
          language: dto.language ?? 'pl',
          notes: dto.notes,
          issuerName: dto.issuerName,
          issuerNip: dto.issuerNip,
          issuerAddr: dto.issuerAddr,
          totalNet: totals.totalNet,
          totalVat: totals.totalVat,
          totalGross: totals.totalGross,
          items: {
            create: items.map((item) => ({
              productId: item.productId ?? null,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              priceNet: item.priceNet,
              vatRate: item.vatRate,
              discount: item.discount ?? 0
            }))
          }
        }
      })

      if (['INVOICE', 'RECEIPT', 'NO_VAT'].includes(dto.type)) {
        for (const item of items) {
          if (item.productId && item.unit !== 'HOUR') { // Do not track stock for services/hours
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: Number(item.quantity) } }
            })
          }
        }
      }

      return invoice
    })
  }

  async update(companyId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.get(companyId, id)
    const isStockDoc = ['INVOICE', 'RECEIPT', 'NO_VAT'].includes(invoice.type)

    return this.prisma.$transaction(async (tx) => {
      // If items are modified, handle stock
      if (dto.items) {
        // 1. Revert stock for OLD items
        if (isStockDoc) {
          for (const item of invoice.items) {
            if (item.productId && item.unit !== 'HOUR') {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: Number(item.quantity) } }
              })
            }
          }
        }

        // 2. Validate and prepare NEW items
        const { items: newItems, totals } = calcTotals(dto.type || invoice.type, dto.items as any)

        if (isStockDoc) {
          for (const item of newItems) {
            if (item.productId && item.unit !== 'HOUR') {
              const product = await tx.product.findUnique({ where: { id: item.productId } })
              if (!product) continue
              if (product.stock < Number(item.quantity)) {
                throw new BadRequestException(`Niewystarczający stan magazynowy dla produktu: ${item.name}. Dostępne: ${product.stock}, Wymagane: ${item.quantity}`)
              }
            }
          }
        }

        // 3. Delete old items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })

        // 4. Update Invoice
        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            ...dto as any,
            totalNet: totals.totalNet,
            totalVat: totals.totalVat,
            totalGross: totals.totalGross,
            items: {
              create: newItems.map((item) => ({
                productId: item.productId ?? null,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                priceNet: item.priceNet,
                vatRate: item.vatRate,
                discount: item.discount ?? 0
              }))
            }
          },
          include: { items: true }
        })

        // 5. Apply stock deduction for NEW items
        if (isStockDoc) {
          for (const item of newItems) {
            if (item.productId && item.unit !== 'HOUR') {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: Number(item.quantity) } }
              })
            }
          }
        }

        return updatedInvoice
      }

      // If items not changed, just update metadata
      return tx.invoice.update({
        where: { id },
        data: dto as any,
        include: { items: true }
      })
    })
  }

  async delete(companyId: string, id: string) {
    const invoice = await this.get(companyId, id)

    return this.prisma.$transaction(async (tx) => {
      // Revert stock
      if (['INVOICE', 'RECEIPT', 'NO_VAT'].includes(invoice.type)) {
         for (const item of invoice.items) {
           if (item.productId && item.unit !== 'HOUR') {
             await tx.product.update({
               where: { id: item.productId },
               data: { stock: { increment: Number(item.quantity) } }
             })
           }
         }
      }

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
      return tx.invoice.delete({ where: { id } })
    })
  }
}
