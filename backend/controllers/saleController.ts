import { Request, Response } from 'express'
import { saleService } from '../services/saleService'

export const saleController = {
  // Obtener todas las ventas
  async getAllSales(req: Request, res: Response) {
    try {
      const sales = await saleService.getAllSales()
      res.json(sales)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener ventas' })
    }
  },

  // Obtener una venta por ID
  async getSaleById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const sale = await saleService.getSaleById(id)
      if (!sale) {
        return res.status(404).json({ error: 'Venta no encontrada' })
      }
      res.json(sale)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la venta' })
    }
  },

  // Crear una nueva venta
  async createSale(req: Request, res: Response) {
    try {
      const sale = await saleService.createSale(req.body)
      res.status(201).json(sale)
    } catch (error) {
      res.status(500).json({ error: 'Error al crear la venta' })
    }
  },

  // Actualizar una venta
  async updateSale(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const sale = await saleService.updateSale(id, status)
      res.json(sale)
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar la venta' })
    }
  },

  // Eliminar una venta
  async deleteSale(req: Request, res: Response) {
    try {
      const { id } = req.params
      await saleService.deleteSale(id)
      res.json({ message: 'Venta eliminada correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la venta' })
    }
  }
}
