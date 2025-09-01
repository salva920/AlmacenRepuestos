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
  Text,
  HStack,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiShoppingCart } from 'react-icons/fi'

interface Customer {
  id: string
  name: string
  cedula: string
  email: string
  phone: string
  address: string
}

interface Sale {
  id: string
  total: number
  status: string
  createdAt: string
  paymentType: string
  paymentMethod: string
  items: Array<{
    product: {
      name: string
      price: number
    }
    quantity: number
    price: number
  }>
}

export default function ClientesPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isSalesOpen, onOpen: onSalesOpen, onClose: onSalesClose } = useDisclosure()
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [formData, setFormData] = React.useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    address: ''
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Error al cargar clientes')
      return res.json()
    }
  })

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return []
    if (!searchQuery) return customers
    
    const query = searchQuery.toLowerCase()
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) || 
      customer.cedula.toLowerCase().includes(query)
    )
  }, [customers, searchQuery])

  const { data: customerSales } = useQuery<Sale[]>({
    queryKey: ['customer-sales', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return []
      const res = await fetch(`/api/customers/${selectedCustomer.id}/sales`)
      if (!res.ok) throw new Error('Error al cargar ventas del cliente')
      return res.json()
    },
    enabled: !!selectedCustomer
  })

  const createMutation = useMutation({
    mutationFn: async (newCustomer: Omit<Customer, 'id'>) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      if (!res.ok) throw new Error('Error al crear cliente')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      toast({
        title: 'Cliente creado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (customer: Customer) => {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      })
      if (!res.ok) throw new Error('Error al actualizar cliente')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      toast({
        title: 'Cliente actualizado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar cliente')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Cliente eliminado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCustomer) {
      updateMutation.mutate({ ...formData, id: selectedCustomer.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      cedula: customer.cedula,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    })
    onOpen()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleNew = () => {
    setSelectedCustomer(null)
    setFormData({
      name: '',
      cedula: '',
      email: '',
      phone: '',
      address: ''
    })
    onOpen()
  }

  const handleViewSales = (customer: Customer) => {
    setSelectedCustomer(customer)
    onSalesOpen()
  }

  const calculateTotalSales = (sales: Sale[] | undefined) => {
    if (!sales) return 0
    return sales.reduce((total, sale) => total + sale.total, 0)
  }

  const calculatePendingPayments = (sales: Sale[] | undefined) => {
    if (!sales) return 0
    return sales
      .filter(sale => sale.status === 'pending')
      .reduce((total, sale) => total + sale.total, 0)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (filteredCustomers.length === 0) {
      toast({
        title: 'Cliente no encontrado',
        description: '¿Desea registrar un nuevo cliente?',
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top',
        onCloseComplete: () => {
          setFormData(prev => ({
            ...prev,
            name: searchQuery.includes('-') ? '' : searchQuery,
            cedula: searchQuery.includes('-') ? searchQuery : ''
          }))
          handleNew()
        }
      })
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Heading>Clientes</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleNew}>
          Nuevo Cliente
        </Button>
      </Box>

      <Box mb={6}>
        <form onSubmit={handleSearch}>
          <FormControl>
            <Input
              placeholder="Buscar por nombre o cédula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
            />
          </FormControl>
        </form>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Cédula/RIF</Th>
              <Th>Email</Th>
              <Th>Teléfono</Th>
              <Th>Dirección</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredCustomers?.map((customer) => (
              <Tr key={customer.id}>
                <Td>{customer.name}</Td>
                <Td>{customer.cedula}</Td>
                <Td>{customer.email}</Td>
                <Td>{customer.phone}</Td>
                <Td>{customer.address}</Td>
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<FiShoppingCart />}
                    mr={2}
                    onClick={() => handleViewSales(customer)}
                  >
                    Ventas
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiEdit2 />}
                    mr={2}
                    onClick={() => handleEdit(customer)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    onClick={() => handleDelete(customer.id)}
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
            {selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                <FormControl isRequired>
                  <FormLabel>Cédula/RIF</FormLabel>
                  <Input
                    value={formData.cedula}
                    onChange={(e) =>
                      setFormData({ ...formData, cedula: e.target.value })
                    }
                    placeholder="V-12345678 o J-123456789"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Dirección</FormLabel>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedCustomer ? 'Actualizar' : 'Crear'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSalesOpen} onClose={onSalesClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>
            Historial de Ventas - {selectedCustomer?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
              <GridItem>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Total de Ventas</StatLabel>
                      <StatNumber>${calculateTotalSales(customerSales).toFixed(2)}</StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        Total histórico
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Pendiente por Pagar</StatLabel>
                      <StatNumber color={calculatePendingPayments(customerSales) > 0 ? 'red.500' : 'green.500'}>
                        ${calculatePendingPayments(customerSales).toFixed(2)}
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type={calculatePendingPayments(customerSales) > 0 ? 'decrease' : 'increase'} />
                        {calculatePendingPayments(customerSales) > 0 ? 'Pendiente' : 'Al día'}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>

            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Fecha</Th>
                    <Th>Total</Th>
                    <Th>Estado</Th>
                    <Th>Método de Pago</Th>
                    <Th minW="300px">Detalles</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerSales?.map((sale) => (
                    <Tr key={sale.id}>
                      <Td>{new Date(sale.createdAt).toLocaleDateString()}</Td>
                      <Td>${sale.total.toFixed(2)}</Td>
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
                            ? 'Completado'
                            : sale.status === 'pending'
                            ? 'Pendiente'
                            : 'Cancelado'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={sale.paymentMethod === 'efectivo' ? 'green' : 'blue'}>
                          {sale.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </Badge>
                        {sale.paymentType === 'credito' && (
                          <Badge colorScheme="purple" ml={2}>
                            Crédito
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          {sale.items.map((item, index) => (
                            <Text key={index} fontSize="sm">
                              {item.quantity}x {item.product.name} - ${item.price.toFixed(2)}
                            </Text>
                          ))}
                        </VStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
} 