'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Grid,
  GridItem,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Icon
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiArrowUp, FiArrowDown, FiDollarSign } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Gasto {
  id: string
  descripcion: string
  monto: number
  categoria: string
  fecha: string
}

interface Venta {
  id: string
  total: number
  fecha: string
  status: string
  ganancia: number
  items: Array<{
    ganancia: number
  }>
}

export default function ControlFinanciero() {
  const [filtroFecha, setFiltroFecha] = useState({ start: null as Date | null, end: null as Date | null })
  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: '',
    descripcion: '',
    monto: '',
    categoria: '',
    fecha: new Date(),
    moneda: 'USD'
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: ventas, isLoading: loadingVentas } = useQuery({
    queryKey: ['ventas'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error al cargar ventas')
      return res.json()
    }
  })

  const { data: gastos, isLoading: loadingGastos } = useQuery({
    queryKey: ['gastos'],
    queryFn: async () => {
      const res = await fetch('/api/gastos')
      if (!res.ok) throw new Error('Error al cargar gastos')
      return res.json()
    }
  })

  const addGastoMutation = useMutation({
    mutationFn: async (gasto: Omit<Gasto, 'id'>) => {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasto)
      })
      if (!res.ok) throw new Error('Error al crear gasto')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      setNuevoGasto({
        concepto: '',
        descripcion: '',
        monto: '',
        categoria: '',
        fecha: new Date(),
        moneda: 'USD'
      })
      toast({
        title: 'Gasto registrado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteGastoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/gastos/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar gasto')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      toast({
        title: 'Gasto eliminado',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoGasto.concepto || !nuevoGasto.monto || !nuevoGasto.categoria) {
      toast({
        title: 'Complete todos los campos',
        status: 'error',
        duration: 3000
      })
      return
    }

    addGastoMutation.mutate({
      descripcion: nuevoGasto.descripcion,
      monto: Number(nuevoGasto.monto),
      categoria: nuevoGasto.categoria,
      fecha: nuevoGasto.fecha.toISOString()
    })
  }

  const handleDeleteGasto = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este gasto?')) {
      deleteGastoMutation.mutate(id)
    }
  }

  const procesarDatos = () => {
    const gastosFiltrados = gastos?.filter(g => {
      if (!filtroFecha.start || !filtroFecha.end) return true
      const fechaGasto = new Date(g.fecha)
      const start = new Date(filtroFecha.start)
      const end = new Date(filtroFecha.end)
      return fechaGasto >= start && fechaGasto <= end
    }) || []

    const ventasFiltradas = ventas?.filter(v => {
      if (!filtroFecha.start || !filtroFecha.end) return true
      const fechaVenta = new Date(v.createdAt)
      const start = new Date(filtroFecha.start)
      const end = new Date(filtroFecha.end)
      return fechaVenta >= start && fechaVenta <= end
    }) || []

    const totalVentas = ventasFiltradas.reduce((acc, v) => acc + v.total, 0)
    const totalGastos = gastosFiltrados.reduce((acc, g) => acc + g.monto, 0)
    const gananciaNeta = ventasFiltradas.reduce((acc, v) => acc + v.ganancia, 0) - totalGastos

    const categoriasGastos = [
      { name: 'Empresariales', value: gastosFiltrados.filter(g => g.categoria === 'empresariales').length },
      { name: 'Personales', value: gastosFiltrados.filter(g => g.categoria === 'personales').length }
    ]

    return {
      totalVentas,
      totalGastos,
      gananciaNeta,
      categoriasGastos,
      gastosFiltrados
    }
  }

  const { totalVentas, totalGastos, gananciaNeta, categoriasGastos, gastosFiltrados } = procesarDatos()

  if (loadingVentas || loadingGastos) {
    return <Box>Cargando...</Box>
  }

  return (
    <Container maxW="container.xl">
      <Heading size="lg" mb={6}>Control Financiero</Heading>

      {/* Filtros */}
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        <GridItem>
          <FormControl>
            <FormLabel>Fecha Inicial</FormLabel>
            <DatePicker
              selected={filtroFecha.start}
              onChange={(dates: [Date, Date]) => setFiltroFecha(prev => ({ ...prev, start: dates[0] }))}
              customInput={<Input />}
              selectsRange={true}
            />
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl>
            <FormLabel>Fecha Final</FormLabel>
            <DatePicker
              selected={filtroFecha.end}
              onChange={(dates: [Date, Date]) => setFiltroFecha(prev => ({ ...prev, end: dates[1] }))}
              customInput={<Input />}
              selectsRange={true}
            />
          </FormControl>
        </GridItem>
        <GridItem>
          <Button
            mt={8}
            onClick={() => setFiltroFecha({ start: null, end: null })}
            width="full"
          >
            Limpiar Filtros
          </Button>
        </GridItem>
      </Grid>

      {/* Estadísticas */}
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={6}>
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ventas Totales</StatLabel>
                <StatNumber>${totalVentas.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Ventas del período
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Gastos Totales</StatLabel>
                <StatNumber>${totalGastos.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Gastos del período
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ganancia Neta</StatLabel>
                <StatNumber color={gananciaNeta >= 0 ? 'green.500' : 'red.500'}>
                  ${gananciaNeta.toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={gananciaNeta >= 0 ? 'increase' : 'decrease'} />
                  {gananciaNeta >= 0 ? 'Beneficio' : 'Pérdida'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Formulario de Gastos */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Registrar Nuevo Gasto</Heading>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleAddGasto}>
            <Grid templateColumns="repeat(4, 1fr)" gap={4}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Concepto</FormLabel>
                  <Input
                    value={nuevoGasto.concepto}
                    onChange={e => setNuevoGasto(prev => ({ ...prev, concepto: e.target.value }))}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Input
                    value={nuevoGasto.descripcion}
                    onChange={e => setNuevoGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Monto</FormLabel>
                  <Input
                    type="number"
                    value={nuevoGasto.monto}
                    onChange={e => setNuevoGasto(prev => ({ ...prev, monto: e.target.value }))}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={nuevoGasto.moneda}
                    onChange={e => setNuevoGasto(prev => ({ ...prev, moneda: e.target.value }))}
                  >
                    <option value="USD">USD</option>
                    <option value="Bs">Bs</option>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={nuevoGasto.categoria}
                    onChange={e => setNuevoGasto(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    <option value="">Seleccione...</option>
                    <option value="empresariales">Empresariales</option>
                    <option value="personales">Personales</option>
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Fecha</FormLabel>
                  <DatePicker
                    selected={nuevoGasto.fecha}
                    onChange={(dates: [Date, Date]) => setNuevoGasto(prev => ({ ...prev, fecha: dates[0] }))}
                    customInput={<Input />}
                    selectsRange={true}
                  />
                </FormControl>
              </GridItem>
            </Grid>
            <Button
              type="submit"
              colorScheme="blue"
              mt={4}
              isLoading={addGastoMutation.isPending}
            >
              Agregar Gasto
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Tabla de Gastos */}
      <Card>
        <CardHeader>
          <Heading size="md">Listado de Gastos</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Descripción</Th>
                <Th>Categoría</Th>
                <Th>Monto</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {gastosFiltrados.map(gasto => (
                <Tr key={gasto.id}>
                  <Td>{new Date(gasto.fecha).toLocaleDateString()}</Td>
                  <Td>{gasto.descripcion}</Td>
                  <Td>
                    <Badge colorScheme={gasto.categoria === 'empresariales' ? 'blue' : 'purple'}>
                      {gasto.categoria}
                    </Badge>
                  </Td>
                  <Td>${gasto.monto.toFixed(2)}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteGasto(gasto.id)}
                      isLoading={deleteGastoMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Container>
  )
} 