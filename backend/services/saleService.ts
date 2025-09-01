import prisma from '../utils/prisma'
import { Sale, SaleItem, Product } from '@prisma/client'
import { Types } from 'mongoose'

export const saleService = {
  // Obtener todas las ventas
  async getAllSales(): Promise<Sale[]> {
    return prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  // Obtener una venta por ID
  async getSaleById(id: string): Promise<Sale | null> {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  // Crear una nueva venta
  async createSale(data: {
    customerId: string
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
    total: number
    status: string
    invoiceNumber: string
    paymentType: string
    paymentMethod: string
    bank?: string
    amountPaid?: number
  }): Promise<Sale> {
    return prisma.$transaction(async (prisma) => {
      // Crear la venta
      const sale = await prisma.sale.create({
        data: {
          customer: { connect: { id: data.customerId } },
          total: data.total,
          status: data.status,
          invoiceNumber: data.invoiceNumber,
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          bank: data.bank,
          amountPaid: data.amountPaid,
          items: {
            create: data.items
          }
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Actualizar el stock de los productos
      for (const item of data.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return sale
    })
  },

  // Actualizar una venta
  async updateSale(id: string, status: string): Promise<Sale> {
    return prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  },

  // Eliminar una venta
  async deleteSale(id: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      // Obtener la venta con sus items
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: true
        }
      })

      if (!sale) {
        throw new Error('Venta no encontrada')
      }

      // Restaurar el stock de los productos
      for (const item of sale.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }

      // Eliminar la venta
      await prisma.sale.delete({
        where: { id }
      })
    })
  }
}
