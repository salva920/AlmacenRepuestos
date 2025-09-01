'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Select,
  FormControl,
  FormLabel,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Venta {
  id: string
  total: number
  fecha: string
  status: string
  items: {
    quantity: number
    product: {
      name: string
    }
  }[]
}

export default function ReportesFinancieros() {
  const [periodo, setPeriodo] = useState('mes')
  const cardBg = useColorModeValue('white', 'gray.700')

  const { data: ventas, isLoading } = useQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error al cargar ventas')
      return res.json()
    }
  })

  const getDatosGrafico = () => {
    if (!ventas) return []

    const ahora = new Date()
    const datos = []

    if (periodo === 'mes') {
      for (let i = 0; i < 12; i++) {
        const mes = new Date(ahora.getFullYear(), i, 1)
        const total = ventas
          .filter(v => new Date(v.fecha).getMonth() === i && new Date(v.fecha).getFullYear() === ahora.getFullYear())
          .reduce((acc, v) => acc + v.total, 0)
        
        datos.push({
          name: mes.toLocaleString('default', { month: 'short' }),
          Ventas: total
        })
      }
    } else if (periodo === 'semana') {
      for (let i = 0; i < 7; i++) {
        const dia = new Date(ahora.setDate(ahora.getDate() - i))
        const total = ventas
          .filter(v => new Date(v.fecha).toDateString() === dia.toDateString())
          .reduce((acc, v) => acc + v.total, 0)
        
        datos.push({
          name: dia.toLocaleString('default', { weekday: 'short' }),
          Ventas: total
        })
      }
    }

    return datos.reverse()
  }

  const getProductosMasVendidos = () => {
    if (!ventas) return []

    const productos = ventas.reduce((acc, venta) => {
      venta.items.forEach(item => {
        const nombre = item.product.name
        if (!acc[nombre]) {
          acc[nombre] = 0
        }
        acc[nombre] += item.quantity
      })
      return acc
    }, {})

    return Object.entries(productos)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (isLoading) {
    return <Box>Cargando...</Box>
  }

  const datosGrafico = getDatosGrafico()
  const productosMasVendidos = getProductosMasVendidos()

  return (
    <Container maxW="container.xl">
      <Heading size="lg" mb={6}>Reportes Financieros</Heading>

      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Ventas Totales</StatLabel>
                <StatNumber>
                  ${ventas?.reduce((acc, v) => acc + v.total, 0).toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Total histórico
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Ventas del Mes</StatLabel>
                <StatNumber>
                  ${ventas
                    ?.filter(v => {
                      const fecha = new Date(v.fecha)
                      const ahora = new Date()
                      return fecha.getMonth() === ahora.getMonth() &&
                             fecha.getFullYear() === ahora.getFullYear()
                    })
                    .reduce((acc, v) => acc + v.total, 0)
                    .toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Mes actual
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Ventas del Día</StatLabel>
                <StatNumber>
                  ${ventas
                    ?.filter(v => {
                      const fecha = new Date(v.fecha)
                      const hoy = new Date()
                      return fecha.toDateString() === hoy.toDateString()
                    })
                    .reduce((acc, v) => acc + v.total, 0)
                    .toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Hoy
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Tendencia de Ventas</Heading>
              <FormControl mt={4}>
                <FormLabel>Periodo</FormLabel>
                <Select value={periodo} onChange={e => setPeriodo(e.target.value)}>
                  <option value="mes">Últimos 12 meses</option>
                  <option value="semana">Última semana</option>
                </Select>
              </FormControl>
            </CardHeader>
            <CardBody>
              <Box height="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Productos Más Vendidos</Heading>
            </CardHeader>
            <CardBody>
              <Box height="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productosMasVendidos}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {productosMasVendidos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  )
} 