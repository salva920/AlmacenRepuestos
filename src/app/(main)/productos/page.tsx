'use client'

import React from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Badge,
  Text
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi'
import TasaCambio from '../../components/TasaCambio'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  minStock: number
  lotes?: LoteProducto[]
}

interface LoteProducto {
  id: string
  cantidad: number
  stockActual: number
  fechaIngreso: string
  precio: number
}

interface TasaCambio {
  id: string
  tasa: number
  fecha: string
}

export default function ProductosPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isIngresoOpen, onOpen: onIngresoOpen, onClose: onIngresoClose } = useDisclosure()
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [cantidadIngreso, setCantidadIngreso] = React.useState('')
  const [precioIngreso, setPrecioIngreso] = React.useState('')
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    minStock: ''
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  const { data: tasaCambio } = useQuery<TasaCambio>({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) throw new Error('Error al cargar la tasa de cambio')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id'>) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })
      if (!res.ok) throw new Error('Error al crear producto')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
      toast({
        title: 'Producto creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id'> & { id: string }) => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })
      if (!res.ok) throw new Error('Error al actualizar producto')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
      toast({
        title: 'Producto actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar producto')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto eliminado',
        status: 'success',
        duration: 3000
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  })

  const ingresoMutation = useMutation({
    mutationFn: async ({ productId, cantidad, precio }: { productId: string; cantidad: number; precio: number }) => {
      const res = await fetch(`/api/products/${productId}/ingreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad, precio })
      })
      if (!res.ok) throw new Error('Error al ingresar stock')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onIngresoClose()
      setCantidadIngreso('')
      setPrecioIngreso('')
      toast({
        title: 'Stock actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const productData = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock)
    }

    if (selectedProduct) {
      updateMutation.mutate({ ...productData, id: selectedProduct.id })
    } else {
      createMutation.mutate(productData)
    }
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString()
    })
    onOpen()
  }

  const handleDelete = (id: string) => {
    const product = products?.find(p => p.id === id)
    if (!product) return

    if (window.confirm(
      `¿Estás seguro de eliminar el producto "${product.name}"?\n\n` +
      'Nota: No se pueden eliminar productos que estén siendo utilizados en ventas.'
    )) {
      deleteMutation.mutate(id)
    }
  }

  const handleNew = () => {
    setSelectedProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      minStock: ''
    })
    onOpen()
  }

  const handleIngreso = (product: Product) => {
    setSelectedProduct(product)
    setCantidadIngreso('')
    setPrecioIngreso(product.price.toString())
    onIngresoOpen()
  }

  const handleSubmitIngreso = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    ingresoMutation.mutate({
      productId: selectedProduct.id,
      cantidad: Number(cantidadIngreso),
      precio: Number(precioIngreso)
    })
  }

  const calcularPrecioBS = (precioUSD: number) => {
    if (!tasaCambio) return 0
    return precioUSD * tasaCambio.tasa
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Heading>Productos</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleNew}>
          Nuevo Producto
        </Button>
      </Box>

      <Box mb={6}>
        <TasaCambio />
      </Box>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Descripción</Th>
              <Th>Precio</Th>
              <Th>Stock</Th>
              <Th>Stock Mínimo</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {products?.map((product) => (
              <Tr key={product.id}>
                <Td>{product.name}</Td>
                <Td>{product.description}</Td>
                <Td>
                  <Text>${product.price}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {calcularPrecioBS(product.price).toFixed(2)} BS
                  </Text>
                </Td>
                <Td>
                  <Badge
                    colorScheme={product.stock <= product.minStock ? 'red' : 'green'}
                  >
                    {product.stock}
                  </Badge>
                </Td>
                <Td>{product.minStock}</Td>
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<FiPackage />}
                    mr={2}
                    colorScheme="green"
                    onClick={() => handleIngreso(product)}
                  >
                    Ingresar
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiEdit2 />}
                    mr={2}
                    onClick={() => handleEdit(product)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    onClick={() => handleDelete(product.id)}
                  >
                    Eliminar
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Precio ($)</FormLabel>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  {formData.price && tasaCambio && (
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {calcularPrecioBS(Number(formData.price)).toFixed(2)} BS
                    </Text>
                  )}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Stock</FormLabel>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <Input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: e.target.value })
                    }
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedProduct ? 'Actualizar' : 'Crear'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isIngresoOpen} onClose={onIngresoClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Ingresar Stock - {selectedProduct?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmitIngreso}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Cantidad a Ingresar</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    value={cantidadIngreso}
                    onChange={(e) => setCantidadIngreso(e.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Precio ($)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioIngreso}
                    onChange={(e) => setPrecioIngreso(e.target.value)}
                  />
                  {precioIngreso && tasaCambio && (
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {calcularPrecioBS(Number(precioIngreso)).toFixed(2)} BS
                    </Text>
                  )}
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="green"
                  width="full"
                  isLoading={ingresoMutation.isPending}
                >
                  Confirmar Ingreso
                </Button>
              </VStack>
            </form>

            {selectedProduct?.lotes && selectedProduct.lotes.length > 0 && (
              <Box mt={6}>
                <Heading size="sm" mb={4}>Lotes Disponibles</Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Fecha Ingreso</Th>
                      <Th>Cantidad Inicial</Th>
                      <Th>Stock Actual</Th>
                      <Th>Precio</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedProduct.lotes.map((lote) => (
                      <Tr key={lote.id}>
                        <Td>{new Date(lote.fechaIngreso).toLocaleDateString()}</Td>
                        <Td>{lote.cantidad}</Td>
                        <Td>
                          <Badge
                            colorScheme={lote.stockActual > 0 ? 'green' : 'red'}
                          >
                            {lote.stockActual}
                          </Badge>
                        </Td>
                        <Td>
                          <Text>${lote.precio}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {calcularPrecioBS(lote.precio).toFixed(2)} BS
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
} 