import { Request, Response } from 'express'
import { productService } from '../services/productService'

export const productController = {
  // Obtener todos los productos
  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts()
      res.json(products)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener productos' })
    }
  },

  // Obtener un producto por ID
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const product = await productService.getProductById(id)
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }
      res.json(product)
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el producto' })
    }
  },

  // Crear un nuevo producto
  async createProduct(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body)
      res.status(201).json(product)
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el producto' })
    }
  },

  // Actualizar un producto
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      const product = await productService.updateProduct(id, req.body)
      res.json(product)
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el producto' })
    }
  },

  // Eliminar un producto
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      await productService.deleteProduct(id)
      res.json({ message: 'Producto eliminado correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el producto' })
    }
  }
}
