import { Router } from 'express'
import { customerController } from '../controllers/customerController'

const router = Router()

// Obtener todos los clientes
router.get('/', customerController.getAllCustomers)

// Obtener un cliente específico
router.get('/:id', customerController.getCustomerById)

// Crear un nuevo cliente
router.post('/', customerController.createCustomer)

// Actualizar un cliente
router.put('/:id', customerController.updateCustomer)

// Eliminar un cliente
router.delete('/:id', customerController.deleteCustomer)

export default router
