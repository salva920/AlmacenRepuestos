'use client'

import React from 'react'
import { Box, Container, Grid, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

interface Sale {
  id: string
  customer: {
    name: string
  }
  total: number
  status: string
  createdAt: string
  items: Array<{
    product: {
      name: string
    }
    quantity: number
  }>
}

interface Product {
  id: string
  name: string
  stock: number
  minStock: number
}

export default function Home() {
  const { 
    data: sales = [], 
    isLoading: isLoadingSales,
    error: salesError 
  } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error al cargar ventas')
      return res.json()
    }
  })

  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError 
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  if (isLoadingSales || isLoadingProducts) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (salesError || productsError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Error al cargar los datos. Por favor, intente nuevamente.
        </Alert>
      </Container>
    )
  }

  // Calcular ventas del día
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySales = sales
    .filter(sale => new Date(sale.createdAt) >= today)
    .reduce((total, sale) => total + (sale.total || 0), 0)

  // Calcular productos con bajo stock
  const lowStockProducts = products.filter(product => (product.stock || 0) <= (product.minStock || 0))

  // Calcular productos más vendidos
  const productCounts: { [key: string]: number } = {}
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (item?.product?.name) {
        const name = item.product.name
        productCounts[name] = (productCounts[name] || 0) + (item.quantity || 0)
      }
    })
  })
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Obtener últimas ventas
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const totalStock = products.reduce((total, p) => total + (p.stock || 0), 0)

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={8}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat
          px={4}
          py={5}
          shadow="xl"
          border="1px solid"
          borderColor="gray.200"
          rounded="lg"
        >
          <StatLabel>Ventas del Día</StatLabel>
          <StatNumber>${todaySales.toFixed(2)}</StatNumber>
          <StatHelpText>
            {sales.length} ventas totales
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={5}
          shadow="xl"
          border="1px solid"
          borderColor="gray.200"
          rounded="lg"
        >
          <StatLabel>Productos en Stock</StatLabel>
          <StatNumber>{products.length}</StatNumber>
          <StatHelpText>
            {totalStock} unidades totales
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={5}
          shadow="xl"
          border="1px solid"
          borderColor="gray.200"
          rounded="lg"
        >
          <StatLabel>Alertas de Stock</StatLabel>
          <StatNumber>{lowStockProducts.length}</StatNumber>
          <StatHelpText>Productos con bajo stock</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        <Box p={6} shadow="xl" border="1px solid" borderColor="gray.200" rounded="lg">
          <Heading size="md" mb={4}>Productos más vendidos</Heading>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Producto</Th>
                <Th isNumeric>Cantidad Vendida</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topProducts.map(([name, quantity]) => (
                <Tr key={name}>
                  <Td>{name}</Td>
                  <Td isNumeric>{quantity}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box p={6} shadow="xl" border="1px solid" borderColor="gray.200" rounded="lg">
          <Heading size="md" mb={4}>Últimas ventas</Heading>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Cliente</Th>
                <Th isNumeric>Total</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentSales.map((sale) => (
                <Tr key={sale.id}>
                  <Td>{sale.customer?.name || 'Cliente desconocido'}</Td>
                  <Td isNumeric>${(sale.total || 0).toFixed(2)}</Td>
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
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Grid>
    </Container>
  )
} 