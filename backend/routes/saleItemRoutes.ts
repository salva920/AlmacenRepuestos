import { Router } from 'express'
import { saleItemController } from '../controllers/saleItemController'

const router = Router()

// Obtener todos los items de venta
router.get('/', saleItemController.getAllSaleItems)

// Obtener un item de venta específico
router.get('/:id', saleItemController.getSaleItemById)

// Obtener items de una venta específica
router.get('/sale/:saleId', saleItemController.getSaleItemsBySaleId)

// Actualizar un item de venta
router.put('/:id', saleItemController.updateSaleItem)

// Eliminar un item de venta
router.delete('/:id', saleItemController.deleteSaleItem)

export default router
