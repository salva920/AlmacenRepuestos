import { Request, Response } from 'express'
import { customerService } from '../services/customerService'

export const customerController = {
  // Obtener todos los clientes
  async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await customerService.getAllCustomers()
      res.json(customers)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener clientes' })
    }
  },

  // Obtener un cliente por ID
  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const customer = await customerService.getCustomerById(id)
      if (!customer) {
        return res.status(404).json({ error: 'Cliente no encontrado' })
      }
      res.json(customer)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el cliente' })
    }
  },

  // Crear un nuevo cliente
  async createCustomer(req: Request, res: Response) {
    try {
      const customer = await customerService.createCustomer(req.body)
      res.status(201).json(customer)
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el cliente' })
    }
  },

  // Actualizar un cliente
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params
      const customer = await customerService.updateCustomer(id, req.body)
      res.json(customer)
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el cliente' })
    }
  },

  // Eliminar un cliente
  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params
      await customerService.deleteCustomer(id)
      res.json({ message: 'Cliente eliminado correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el cliente' })
    }
  }
}
