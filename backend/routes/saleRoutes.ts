import { Router } from 'express'
import { saleController } from '../controllers/saleController'

const router = Router()

// Obtener todas las ventas
router.get('/', saleController.getAllSales)

// Obtener una venta específica
router.get('/:id', saleController.getSaleById)

// Crear una nueva venta
router.post('/', saleController.createSale)

// Actualizar una venta
router.put('/:id', saleController.updateSale)

// Eliminar una venta
router.delete('/:id', saleController.deleteSale)

export default router
