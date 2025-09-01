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
  Select,
  Badge,
  Text,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEye } from 'react-icons/fi'

interface Sale {
  id: string
  customerId: string
  customer: {
    name: string
  }
  total: number
  ganancia: number
  status: string
  createdAt: string
  invoiceNumber: string
  paymentType: string
  paymentMethod: string
  bank: string | null
  amountPaid: number | null
  items: Array<{
    id: string
    productId: string
    product: {
      name: string
      price: number
      lotes?: Array<{
        id: string
        precio: number
        stockActual: number
        fechaIngreso: string
      }>
    }
    quantity: number
    price: number
    ganancia: number
  }>
}

interface Customer {
  id: string
  name: string
  cedula?: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  lotes?: Array<{
    id: string
    precio: number
    stockActual: number
    fechaIngreso: string
  }>
}

export default function VentasPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null)
  const [customerSearch, setCustomerSearch] = React.useState('')
  const [formData, setFormData] = React.useState({
    customerId: '',
    items: [{ productId: '', quantity: 1, price: 0 }]
  })
  const [paymentData, setPaymentData] = React.useState({
    invoiceNumber: '',
    paymentType: 'contado',
    paymentMethod: 'efectivo',
    bank: '',
    amountPaid: 0
  })
  const [filters, setFilters] = React.useState({
    startDate: '',
    endDate: '',
    searchTerm: ''
  })
  const [errors, setErrors] = React.useState({
    invoiceNumber: '',
    bank: '',
    amountPaid: '',
    ganancia: ''
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: sales } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error al cargar ventas')
      return res.json()
    }
  })

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Error al cargar clientes')
      return res.json()
    }
  })

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products?include=lotes')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (newSale: { customerId: string; items: Array<{ productId: string; quantity: number }>; invoiceNumber: string; paymentType: string; paymentMethod: string; bank: string | null; amountPaid: number }) => {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSale)
      })
      if (!res.ok) throw new Error('Error al crear venta')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      onClose()
      toast({
        title: 'Venta creada',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Error al actualizar venta')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      toast({
        title: 'Estado actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, amountPaid }: { id: string; amountPaid: number }) => {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid })
      })
      if (!res.ok) throw new Error('Error al actualizar el pago')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      toast({
        title: 'Pago actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya un cliente seleccionado
    if (!formData.customerId) return;

    // Validar que haya al menos un producto seleccionado
    if (!formData.items.length || !formData.items[0].productId) return;

    // Validar que no haya ganancia negativa
    const hayGananciaNegativa = formData.items.some(item => {
      const gananciaEstimada = calculateGananciaEstimada(item.productId, item.price);
      return gananciaEstimada < 0;
    });

    if (hayGananciaNegativa) {
      setErrors(prev => ({ ...prev, ganancia: 'No se puede registrar una venta con ganancia negativa' }));
      toast({
        title: 'Error',
        description: 'No se puede registrar una venta con ganancia negativa',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const saleData = {
      customerId: formData.customerId,
      items: formData.items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0
      })),
      invoiceNumber: paymentData.invoiceNumber,
      paymentType: paymentData.paymentType,
      paymentMethod: paymentData.paymentMethod,
      bank: paymentData.paymentMethod === 'transferencia' ? paymentData.bank : null,
      amountPaid: Number(paymentData.amountPaid) || 0
    };

    createMutation.mutate(saleData);
  };

  const handleView = (sale: Sale) => {
    setSelectedSale(sale)
    onOpen()
  }

  const handleNew = () => {
    setSelectedSale(null)
    setFormData({
      customerId: '',
      items: [{ productId: '', quantity: 1, price: 0 }]
    })
    onOpen()
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, price: 0 }]
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index: number, field: 'productId' | 'quantity' | 'price', value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { 
      ...newItems[index], 
      [field]: field === 'productId' ? value : Number(value) || 0 
    }
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity
    }, 0)
  }

  const calculateGananciaEstimada = (productId: string, precioVenta: number) => {
    const product = products?.find(p => p.id === productId)
    if (!product?.lotes || product.lotes.length === 0) return 0

    // Ordenar lotes por fecha de ingreso (más antiguos primero)
    const lotesOrdenados = [...product.lotes].sort((a, b) => 
      new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime()
    )

    // Calcular ganancia usando el lote más antiguo como referencia
    const loteMasAntiguo = lotesOrdenados[0]
    return (precioVenta - loteMasAntiguo.precio) * formData.items.find(item => item.productId === productId)?.quantity || 0
  }

  const filteredSales = React.useMemo(() => {
    if (!sales) return []
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      const startDate = filters.startDate ? new Date(filters.startDate) : null
      const endDate = filters.endDate ? new Date(filters.endDate) : null
      
      const matchesDate = (!startDate || saleDate >= startDate) && 
                         (!endDate || saleDate <= endDate)
      
      const matchesSearch = !filters.searchTerm || 
        sale.customer.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        sale.items.some(item => 
          item.product.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )
      
      return matchesDate && matchesSearch
    })
  }, [sales, filters])

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return []
    if (!customerSearch) return customers
    
    const query = customerSearch.toLowerCase()
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) || 
      customer.cedula?.toLowerCase().includes(query)
    )
  }, [customers, customerSearch])

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Heading>Ventas</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleNew}>
          Nueva Venta
        </Button>
      </Box>

      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        <GridItem>
          <FormControl>
            <FormLabel>Fecha Inicio</FormLabel>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl>
            <FormLabel>Fecha Fin</FormLabel>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl>
            <FormLabel>Buscar (Cliente/Producto)</FormLabel>
            <Input
              placeholder="Buscar por nombre..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </FormControl>
        </GridItem>
      </Grid>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Cliente</Th>
              <Th>Productos</Th>
              <Th>Total</Th>
              <Th>Estado</Th>
              <Th>Fecha</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredSales.map((sale) => (
              <Tr key={sale.id}>
                <Td>{sale.customer.name}</Td>
                <Td>
                  {sale.items.map((item, index) => (
                    <Text key={item.id}>
                      {item.product.name} ({item.quantity})
                      {index < sale.items.length - 1 ? ', ' : ''}
                    </Text>
                  ))}
                </Td>
                <Td>${sale.total}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      sale.status === 'completed'
                        ? 'green'
                        : sale.status === 'pending'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {sale.status === 'completed'
                      ? 'Completada'
                      : sale.status === 'pending'
                      ? 'Pendiente'
                      : 'Cancelada'}
                  </Badge>
                </Td>
                <Td>{new Date(sale.createdAt).toLocaleString('es-ES')}</Td>
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<FiEye />}
                    onClick={() => handleView(sale)}
                  >
                    Ver Detalles
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedSale ? 'Detalles de Venta' : 'Nueva Venta'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSale ? (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Cliente:</Text>
                  <Text>{selectedSale.customer.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Número de Factura:</Text>
                  <Text>{selectedSale.invoiceNumber}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Total:</Text>
                  <Text>${selectedSale.total}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Ganancia Total:</Text>
                  <Text color="green.500">${selectedSale.ganancia}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Tipo de Pago:</Text>
                  <Text>{selectedSale.paymentType === 'contado' ? 'Contado' : 'Crédito'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Método de Pago:</Text>
                  <Text>
                    {selectedSale.paymentMethod === 'efectivo' 
                      ? 'Efectivo' 
                      : selectedSale.paymentMethod === 'transferencia'
                      ? 'Transferencia'
                      : 'Pago Móvil'}
                  </Text>
                </Box>
                {selectedSale.paymentMethod !== 'efectivo' && (
                  <Box>
                    <Text fontWeight="bold">Banco:</Text>
                    <Text>{selectedSale.bank}</Text>
                  </Box>
                )}
                {selectedSale.paymentType === 'credito' && (
                  <>
                    <Box>
                      <Text fontWeight="bold">Monto Abonado:</Text>
                      <Text>${selectedSale.amountPaid}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Saldo Pendiente:</Text>
                      <Text>${selectedSale.total - (selectedSale.amountPaid || 0)}</Text>
                    </Box>
                    {selectedSale.status !== 'completed' && (
                      <Box>
                        <FormControl>
                          <FormLabel>Nuevo Abono</FormLabel>
                          <NumberInput
                            min={0}
                            max={selectedSale.total - (selectedSale.amountPaid || 0)}
                            defaultValue={0}
                            onChange={(_, value) => {
                              const newAmountPaid = (selectedSale.amountPaid || 0) + value
                              updatePaymentMutation.mutate({
                                id: selectedSale.id,
                                amountPaid: newAmountPaid
                              })
                            }}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </Box>
                    )}
                  </>
                )}
                <Box>
                  <Text fontWeight="bold">Fecha:</Text>
                  <Text>{new Date(selectedSale.createdAt).toLocaleString('es-ES')}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Estado:</Text>
                  <Badge
                    colorScheme={
                      selectedSale.status === 'completed'
                        ? 'green'
                        : selectedSale.status === 'pending'
                        ? 'yellow'
                        : 'red'
                    }
                  >
                    {selectedSale.status === 'completed'
                      ? 'Completada'
                      : selectedSale.status === 'pending'
                      ? 'Pendiente'
                      : 'Cancelada'}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Productos:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Producto</Th>
                        <Th>Cantidad</Th>
                        <Th>Precio</Th>
                        <Th>Subtotal</Th>
                        <Th>Ganancia</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedSale.items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.product.name}</Td>
                          <Td>{item.quantity}</Td>
                          <Td>${item.price}</Td>
                          <Td>${item.price * item.quantity}</Td>
                          <Td color="green.500">${item.ganancia}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            ) : (
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Buscar Cliente</FormLabel>
                    <Input
                      placeholder="Buscar por nombre o cédula..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        // Si el texto de búsqueda coincide exactamente con un cliente, seleccionarlo
                        const matchingCustomer = customers?.find(c => 
                          c.name.toLowerCase() === e.target.value.toLowerCase() ||
                          c.cedula?.toLowerCase() === e.target.value.toLowerCase()
                        )
                        if (matchingCustomer) {
                          setFormData({ ...formData, customerId: matchingCustomer.id })
                        }
                      }}
                      mb={2}
                    />
                    <Select
                      value={formData.customerId}
                      onChange={(e) => {
                        const selectedCustomer = customers?.find(c => c.id === e.target.value)
                        setFormData({ ...formData, customerId: e.target.value })
                        // Actualizar el campo de búsqueda con el nombre del cliente seleccionado
                        if (selectedCustomer) {
                          setCustomerSearch(selectedCustomer.name)
                        }
                      }}
                    >
                      <option value="">Seleccionar cliente</option>
                      {filteredCustomers?.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.cedula ? `- ${customer.cedula}` : ''}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <Box width="full">
                    <Text fontWeight="bold" mb={2}>
                      Productos
                    </Text>
                    {formData.items.map((item, index) => (
                      <Box key={index} mb={4} p={4} borderWidth={1} borderRadius="md">
                        <FormControl isRequired>
                          <FormLabel>Producto</FormLabel>
                          <Select
                            value={item.productId}
                            onChange={(e) => {
                              const productId = e.target.value
                              const product = products?.find(p => p.id === productId)
                              if (product) {
                                const newItems = [...formData.items]
                                newItems[index] = {
                                  ...newItems[index],
                                  productId: productId,
                                  price: product.price
                                }
                                setFormData({ ...formData, items: newItems })
                              }
                            }}
                          >
                            <option value="">Seleccionar producto</option>
                            {products?.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - ${product.price} (Stock: {product.stock})
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={2}>
                          <GridItem>
                            <FormControl isRequired>
                              <FormLabel>Cantidad</FormLabel>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                            </FormControl>
                          </GridItem>
                          <GridItem>
                            <FormControl isRequired>
                              <FormLabel>Precio de Venta</FormLabel>
                              <NumberInput
                                min={0}
                                value={item.price}
                                onChange={(_, value) => updateItem(index, 'price', value)}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                          </GridItem>
                        </Grid>
                        {item.productId && (
                          <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                            {(() => {
                              const product = products?.find(p => p.id === item.productId)
                              if (!product?.lotes || product.lotes.length === 0) return null
                              
                              // Ordenar lotes por fecha de ingreso (más antiguos primero)
                              const lotesOrdenados = [...product.lotes].sort((a, b) => 
                                new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime()
                              )

                              // Calcular qué lotes se necesitan
                              let cantidadRestante = item.quantity
                              const lotesNecesarios = []
                              
                              for (const lote of lotesOrdenados) {
                                if (cantidadRestante <= 0) break
                                
                                const cantidadDelLote = Math.min(cantidadRestante, lote.stockActual)
                                lotesNecesarios.push({
                                  ...lote,
                                  cantidadUsada: cantidadDelLote
                                })
                                
                                cantidadRestante -= cantidadDelLote
                              }
                              
                              return (
                                <>
                                  <Text fontSize="sm" fontWeight="bold" mb={1}>Información de Lotes a Utilizar:</Text>
                                  <Accordion allowMultiple>
                                    {lotesNecesarios.map((lote, index) => (
                                      <AccordionItem key={lote.id}>
                                        <h2>
                                          <AccordionButton>
                                            <Box flex="1" textAlign="left">
                                              <Text fontWeight="bold">
                                                Lote {index + 1} - {lote.cantidadUsada} unidades
                                              </Text>
                                            </Box>
                                            <AccordionIcon />
                                          </AccordionButton>
                                        </h2>
                                        <AccordionPanel pb={4}>
                                          <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                                            <Box>
                                              <Text fontSize="xs" color="gray.600">Stock Disponible:</Text>
                                              <Text fontSize="sm">{lote.stockActual} unidades</Text>
                                            </Box>
                                            <Box>
                                              <Text fontSize="xs" color="gray.600">Precio de Compra:</Text>
                                              <Text fontSize="sm">${lote.precio}</Text>
                                            </Box>
                                            <Box>
                                              <Text fontSize="xs" color="gray.600">Fecha de Ingreso:</Text>
                                              <Text fontSize="sm">{new Date(lote.fechaIngreso).toLocaleDateString()}</Text>
                                            </Box>
                                          </Grid>
                                        </AccordionPanel>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                  {cantidadRestante > 0 && (
                                    <Text fontSize="sm" color="red.500" mt={2}>
                                      No hay suficiente stock disponible. Faltan {cantidadRestante} unidades.
                                    </Text>
                                  )}
                                  <Text fontSize="sm" color={calculateGananciaEstimada(item.productId, item.price) < 0 ? 'red.500' : 'inherit'} mt={2}>
                                    Ganancia estimada: ${calculateGananciaEstimada(item.productId, item.price)}
                                  </Text>
                                  {calculateGananciaEstimada(item.productId, item.price) < 0 && (
                                    <Text fontSize="sm" color="red.500">
                                      No se puede registrar una venta con ganancia negativa
                                    </Text>
                                  )}
                                </>
                              )
                            })()}
                          </Box>
                        )}
                        {index > 0 && (
                          <Button
                            mt={2}
                            colorScheme="red"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </Box>
                    ))}
                    <Button
                      mt={2}
                      colorScheme="blue"
                      size="sm"
                      onClick={addItem}
                    >
                      Agregar Producto
                    </Button>
                  </Box>

                  <Box width="full" p={4} borderWidth={1} borderRadius="md">
                    <Text fontWeight="bold">Total: ${calculateTotal()}</Text>
                  </Box>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="full">
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Número de Factura</FormLabel>
                        <Input
                          value={paymentData.invoiceNumber}
                          onChange={(e) => {
                            setPaymentData({ ...paymentData, invoiceNumber: e.target.value })
                            setErrors({ ...errors, invoiceNumber: '' })
                          }}
                          isInvalid={!!errors.invoiceNumber}
                        />
                        {errors.invoiceNumber && (
                          <Text color="red.500" fontSize="sm">{errors.invoiceNumber}</Text>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Tipo de Pago</FormLabel>
                        <Select
                          value={paymentData.paymentType}
                          onChange={(e) => setPaymentData({ ...paymentData, paymentType: e.target.value })}
                        >
                          <option value="contado">Contado</option>
                          <option value="credito">Crédito</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Método de Pago</FormLabel>
                        <Select
                          value={paymentData.paymentMethod}
                          onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="pago_movil">Pago Móvil</option>
                        </Select>
                      </FormControl>
                    </GridItem>

                    {paymentData.paymentMethod !== 'efectivo' && (
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel>Banco</FormLabel>
                          <Input
                            value={paymentData.bank}
                            onChange={(e) => {
                              setPaymentData({ ...paymentData, bank: e.target.value })
                              setErrors({ ...errors, bank: '' })
                            }}
                            isInvalid={!!errors.bank}
                          />
                          {errors.bank && (
                            <Text color="red.500" fontSize="sm">{errors.bank}</Text>
                          )}
                        </FormControl>
                      </GridItem>
                    )}

                    {paymentData.paymentType === 'credito' && (
                      <>
                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel>Monto Abonado</FormLabel>
                            <NumberInput
                              min={0}
                              max={calculateTotal()}
                              value={paymentData.amountPaid}
                              onChange={(_, value) => {
                                setPaymentData({ ...paymentData, amountPaid: value })
                                setErrors({ ...errors, amountPaid: '' })
                              }}
                            >
                              <NumberInputField borderColor={errors.amountPaid ? 'red.500' : undefined} />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            {errors.amountPaid && (
                              <Text color="red.500" fontSize="sm">{errors.amountPaid}</Text>
                            )}
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl>
                            <FormLabel>Saldo Pendiente</FormLabel>
                            <Input
                              value={calculateTotal() - paymentData.amountPaid}
                              isReadOnly
                            />
                          </FormControl>
                        </GridItem>
                      </>
                    )}
                  </Grid>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={createMutation.isPending}
                  >
                    Crear Venta
                  </Button>
                </VStack>
              </form>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
} 