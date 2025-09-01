import { Request, Response } from 'express'
import { saleItemService } from '../services/saleItemService'

export const saleItemController = {
  // Obtener todos los items de venta
  async getAllSaleItems(req: Request, res: Response) {
    try {
      const saleItems = await saleItemService.getAllSaleItems()
      res.json(saleItems)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener items de venta' })
    }
  },

  // Obtener un item de venta por ID
  async getSaleItemById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const saleItem = await saleItemService.getSaleItemById(id)
      if (!saleItem) {
        return res.status(404).json({ error: 'Item de venta no encontrado' })
      }
      res.json(saleItem)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el item de venta' })
    }
  },

  // Obtener items de una venta específica
  async getSaleItemsBySaleId(req: Request, res: Response) {
    try {
      const { saleId } = req.params
      const saleItems = await saleItemService.getSaleItemsBySaleId(saleId)
      res.json(saleItems)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener items de la venta' })
    }
  },

  // Actualizar un item de venta
  async updateSaleItem(req: Request, res: Response) {
    try {
      const { id } = req.params
      const updatedSaleItem = await saleItemService.updateSaleItem(id, req.body)
      res.json(updatedSaleItem)
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el item de venta' })
    }
  },

  // Eliminar un item de venta
  async deleteSaleItem(req: Request, res: Response) {
    try {
      const { id } = req.params
      await saleItemService.deleteSaleItem(id)
      res.json({ message: 'Item de venta eliminado correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el item de venta' })
    }
  }
}
