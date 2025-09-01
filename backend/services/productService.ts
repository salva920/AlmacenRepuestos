import prisma from '../utils/prisma'
import { Product } from '@prisma/client'

export const productService = {
  // Obtener todos los productos
  async getAllProducts(): Promise<Product[]> {
    return prisma.product.findMany()
  },

  // Obtener un producto por ID
  async getProductById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id }
    })
  },

  // Crear un nuevo producto
  async createProduct(data: {
    name: string
    description?: string
    price: number
    stock: number
    minStock: number
  }): Promise<Product> {
    return prisma.product.create({
      data
    })
  },

  // Actualizar un producto
  async updateProduct(id: string, data: {
    name?: string
    description?: string
    price?: number
    stock?: number
    minStock?: number
  }): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data
    })
  },

  // Eliminar un producto
  async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id }
    })
  },

  // Actualizar stock
  async updateStock(id: string, quantity: number): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity
        }
      }
    })
  }
}
