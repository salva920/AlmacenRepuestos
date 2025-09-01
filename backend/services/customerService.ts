import prisma from '../utils/prisma'
import { Customer } from '@prisma/client'

export const customerService = {
  // Obtener todos los clientes
  async getAllCustomers(): Promise<Customer[]> {
    return prisma.customer.findMany()
  },

  // Obtener un cliente por ID
  async getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        sales: true
      }
    })
  },

  // Crear un nuevo cliente
  async createCustomer(data: {
    name: string
    cedula: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Customer> {
    return prisma.customer.create({
      data
    })
  },

  // Actualizar un cliente
  async updateCustomer(id: string, data: {
    name?: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data
    })
  },

  // Eliminar un cliente
  async deleteCustomer(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id }
    })
  }
}
