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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useColorModeValue
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Transaccion {
  id: string
  fecha: string
  concepto: string
  moneda: 'USD' | 'Bs'
  entrada: number
  salida: number
  saldo: number
  tasaCambio: number
}

interface TasaCambio {
  id: string
  tasa: number
  fecha: string
}

export default function GestionCaja() {
  const [filtroFecha, setFiltroFecha] = useState({ start: null, end: null })
  const [filtroMoneda, setFiltroMoneda] = useState('TODAS')
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    fecha: new Date(),
    concepto: '',
    moneda: 'USD' as 'USD' | 'Bs',
    tipo: 'entrada' as 'entrada' | 'salida',
    monto: '',
    tasaCambio: 0
  })
  const [editingTransaction, setEditingTransaction] = useState<Transaccion | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()
  const cardBg = useColorModeValue('white', 'gray.700')

  const { data: transacciones, isLoading } = useQuery({
    queryKey: ['transacciones'],
    queryFn: async () => {
      const res = await fetch('/api/caja')
      if (!res.ok) throw new Error('Error al cargar transacciones')
      return res.json()
    }
  })

  const { data: tasaCambio } = useQuery({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) throw new Error('Error al cargar tasa de cambio')
      return res.json()
    }
  })

  const addTransaccionMutation = useMutation({
    mutationFn: async (transaccion: Omit<Transaccion, 'id' | 'saldo'>) => {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaccion)
      })
      if (!res.ok) throw new Error('Error al crear transacción')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacciones'] })
      setNuevaTransaccion({
        fecha: new Date(),
        concepto: '',
        moneda: 'USD',
        tipo: 'entrada',
        monto: '',
        tasaCambio: tasaCambio?.tasa || 0
      })
      onClose()
      toast({
        title: 'Transacción registrada',
        status: 'success',
        duration: 3000
      })
    }
  })

  const deleteTransaccionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/caja/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error al eliminar transacción')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacciones'] })
      toast({
        title: 'Transacción eliminada',
        status: 'success',
        duration: 3000
      })
    }
  })

  const handleAddTransaccion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTransaccion.concepto || !nuevaTransaccion.monto) {
      toast({
        title: 'Complete todos los campos',
        status: 'error',
        duration: 3000
      })
      return
    }

    const transaccion: Omit<Transaccion, 'id' | 'saldo'> = {
      fecha: nuevaTransaccion.fecha.toISOString(),
      concepto: nuevaTransaccion.concepto,
      moneda: nuevaTransaccion.moneda,
      entrada: nuevaTransaccion.tipo === 'entrada' ? Number(nuevaTransaccion.monto) : 0,
      salida: nuevaTransaccion.tipo === 'salida' ? Number(nuevaTransaccion.monto) : 0,
      tasaCambio: tasaCambio?.tasa || 0
    }

    addTransaccionMutation.mutate(transaccion)
  }

  const handleDeleteTransaccion = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta transacción?')) {
      deleteTransaccionMutation.mutate(id)
    }
  }

  const handleEditTransaccion = (transaccion: Transaccion) => {
    setEditingTransaction(transaccion)
    setNuevaTransaccion({
      fecha: new Date(transaccion.fecha),
      concepto: transaccion.concepto,
      moneda: transaccion.moneda,
      tipo: transaccion.entrada > 0 ? 'entrada' : 'salida',
      monto: String(transaccion.entrada || transaccion.salida),
      tasaCambio: transaccion.tasaCambio
    })
    onOpen()
  }

  const getSaldos = () => {
    if (!transacciones) return { USD: 0, Bs: 0 }

    return transacciones.reduce((acc, t) => {
      if (t.moneda === 'USD') {
        acc.USD += t.entrada - t.salida
      } else {
        acc.Bs += t.entrada - t.salida
      }
      return acc
    }, { USD: 0, Bs: 0 })
  }

  const saldos = getSaldos()
  const totalUSD = saldos.USD + (saldos.Bs / (tasaCambio?.tasa || 1))

  const transaccionesFiltradas = transacciones?.filter(t => {
    const fecha = new Date(t.fecha)
    const start = filtroFecha.start ? new Date(filtroFecha.start) : null
    const end = filtroFecha.end ? new Date(filtroFecha.end) : null
    
    const matchesFecha = (!start || fecha >= start) && (!end || fecha <= end)
    const matchesMoneda = filtroMoneda === 'TODAS' || t.moneda === filtroMoneda
    
    return matchesFecha && matchesMoneda
  }) || []

  if (isLoading) {
    return <Box>Cargando...</Box>
  }

  return (
    <Container maxW="container.xl">
      <Heading size="lg" mb={6}>Gestión de Caja</Heading>

      {/* Resumen de Saldos */}
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={6}>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Saldo en Dólares</StatLabel>
                <StatNumber>${saldos.USD.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type={saldos.USD >= 0 ? 'increase' : 'decrease'} />
                  Saldo actual
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Saldo en Bolívares</StatLabel>
                <StatNumber>Bs {saldos.Bs.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type={saldos.Bs >= 0 ? 'increase' : 'decrease'} />
                  Saldo actual
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Total Consolidado</StatLabel>
                <StatNumber>${totalUSD.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type={totalUSD >= 0 ? 'increase' : 'decrease'} />
                  Valor total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Filtros */}
      <Card bg={cardBg} mb={6}>
        <CardBody>
          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
            <GridItem>
              <FormControl>
                <FormLabel>Moneda</FormLabel>
                <Select value={filtroMoneda} onChange={e => setFiltroMoneda(e.target.value)}>
                  <option value="TODAS">Todas</option>
                  <option value="USD">Dólares</option>
                  <option value="Bs">Bolívares</option>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>Fecha Inicial</FormLabel>
                <DatePicker
                  selected={filtroFecha.start}
                  onChange={(dates: [Date, Date]) => setFiltroFecha(prev => ({ ...prev, start: dates[0] }))}
                  customInput={<Input />}
                  selectsMultiple={true}
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
                  selectsMultiple={true}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <Button
                mt={8}
                onClick={() => {
                  setFiltroFecha({ start: null, end: null })
                  setFiltroMoneda('TODAS')
                }}
                width="full"
              >
                Limpiar Filtros
              </Button>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      {/* Tabla de Transacciones */}
      <Card bg={cardBg}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Movimientos</Heading>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => {
                setEditingTransaction(null)
                setNuevaTransaccion({
                  fecha: new Date(),
                  concepto: '',
                  moneda: 'USD',
                  tipo: 'entrada',
                  monto: '',
                  tasaCambio: tasaCambio?.tasa || 0
                })
                onOpen()
              }}
            >
              Nueva Transacción
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Concepto</Th>
                <Th>Moneda</Th>
                <Th>Entrada</Th>
                <Th>Salida</Th>
                <Th>Saldo</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transaccionesFiltradas.map(transaccion => (
                <Tr key={transaccion.id}>
                  <Td>{new Date(transaccion.fecha).toLocaleDateString()}</Td>
                  <Td>{transaccion.concepto}</Td>
                  <Td>
                    <Badge colorScheme={transaccion.moneda === 'USD' ? 'blue' : 'green'}>
                      {transaccion.moneda}
                    </Badge>
                  </Td>
                  <Td color="green.500">
                    {transaccion.entrada > 0 ? `${transaccion.moneda} ${transaccion.entrada.toFixed(2)}` : '-'}
                  </Td>
                  <Td color="red.500">
                    {transaccion.salida > 0 ? `${transaccion.moneda} ${transaccion.salida.toFixed(2)}` : '-'}
                  </Td>
                  <Td>{`${transaccion.moneda} ${transaccion.saldo.toFixed(2)}`}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<FiEdit2 />}
                        onClick={() => handleEditTransaccion(transaccion)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteTransaccion(transaccion.id)}
                        isLoading={deleteTransaccionMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal de Nueva/Editar Transacción */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleAddTransaccion}>
            <ModalHeader>
              {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Fecha</FormLabel>
                  <DatePicker
                    selected={nuevaTransaccion.fecha}
                    onChange={(dates: [Date, Date]) => setNuevaTransaccion(prev => ({ ...prev, fecha: dates[0] }))}
                    customInput={<Input />}
                    selectsMultiple={true}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Concepto</FormLabel>
                  <Input
                    value={nuevaTransaccion.concepto}
                    onChange={e => setNuevaTransaccion(prev => ({ ...prev, concepto: e.target.value }))}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={nuevaTransaccion.moneda}
                    onChange={e => setNuevaTransaccion(prev => ({ ...prev, moneda: e.target.value as 'USD' | 'Bs' }))}
                  >
                    <option value="USD">Dólares</option>
                    <option value="Bs">Bolívares</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={nuevaTransaccion.tipo}
                    onChange={e => setNuevaTransaccion(prev => ({ ...prev, tipo: e.target.value as 'entrada' | 'salida' }))}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Monto</FormLabel>
                  <Input
                    type="number"
                    value={nuevaTransaccion.monto}
                    onChange={e => setNuevaTransaccion(prev => ({ ...prev, monto: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                mt={4}
                isLoading={addTransaccionMutation.isPending}
              >
                Agregar Transacción
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  )
} 