import prisma from '../utils/prisma'
import { SaleItem } from '@prisma/client'

export const saleItemService = {
  // Obtener todos los items de venta
  async getAllSaleItems(): Promise<SaleItem[]> {
    return prisma.saleItem.findMany({
      include: {
        sale: true,
        product: true
      }
    })
  },

  // Obtener un item de venta por ID
  async getSaleItemById(id: string): Promise<SaleItem | null> {
    return prisma.saleItem.findUnique({
      where: { id },
      include: {
        sale: true,
        product: true
      }
    })
  },

  // Obtener items de una venta específica
  async getSaleItemsBySaleId(saleId: string): Promise<SaleItem[]> {
    return prisma.saleItem.findMany({
      where: { saleId },
      include: {
        product: true
      }
    })
  },

  // Actualizar un item de venta
  async updateSaleItem(id: string, data: {
    quantity?: number
    price?: number
  }): Promise<SaleItem> {
    return prisma.$transaction(async (prisma) => {
      const saleItem = await prisma.saleItem.findUnique({
        where: { id },
        include: {
          product: true
        }
      })

      if (!saleItem) {
        throw new Error('Item de venta no encontrado')
      }

      // Actualizar el stock del producto si la cantidad cambia
      if (data.quantity && data.quantity !== saleItem.quantity) {
        const quantityDifference = data.quantity - saleItem.quantity
        await prisma.product.update({
          where: { id: saleItem.productId },
          data: {
            stock: {
              decrement: quantityDifference
            }
          }
        })
      }

      // Actualizar el item de venta
      return prisma.saleItem.update({
        where: { id },
        data,
        include: {
          product: true
        }
      })
    })
  },

  // Eliminar un item de venta
  async deleteSaleItem(id: string): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      const saleItem = await prisma.saleItem.findUnique({
        where: { id },
        include: {
          product: true
        }
      })

      if (!saleItem) {
        throw new Error('Item de venta no encontrado')
      }

      // Restaurar el stock del producto
      await prisma.product.update({
        where: { id: saleItem.productId },
        data: {
          stock: {
            increment: saleItem.quantity
          }
        }
      })

      // Eliminar el item de venta
      await prisma.saleItem.delete({
        where: { id }
      })
    })
  }
}
