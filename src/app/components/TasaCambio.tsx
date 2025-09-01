'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface TasaCambio {
  id: string
  tasa: number
  fecha: string
}

export default function TasaCambio() {
  const [tasa, setTasa] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: ultimaTasa } = useQuery<TasaCambio>({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) throw new Error('Error al cargar la tasa de cambio')
      return res.json()
    }
  })

  const updateTasaMutation = useMutation({
    mutationFn: async (nuevaTasa: number) => {
      const res = await fetch('/api/tasa-cambio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasa: nuevaTasa })
      })
      if (!res.ok) throw new Error('Error al actualizar la tasa de cambio')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasa-cambio'] })
      toast({
        title: 'Tasa de cambio actualizada',
        status: 'success',
        duration: 3000
      })
      setTasa('')
    },
    onError: () => {
      toast({
        title: 'Error al actualizar la tasa de cambio',
        status: 'error',
        duration: 3000
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tasaNum = Number(tasa)

    if (!tasa || tasaNum <= 0) {
      toast({
        title: 'Error',
        description: 'La tasa de cambio debe ser un número positivo',
        status: 'error',
        duration: 3000
      })
      return
    }

    updateTasaMutation.mutate(tasaNum)
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Tasa de Cambio ($/BS)</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {ultimaTasa && (
            <Box>
              <Text>
                Última tasa de cambio:{' '}
                <Text as="span" fontWeight="bold">
                  {ultimaTasa.tasa} BS
                </Text>
              </Text>
              <Text fontSize="sm" color="gray.500">
                Fecha: {new Date(ultimaTasa.fecha).toLocaleDateString('es-ES')}
              </Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nueva tasa de cambio ($/BS)</FormLabel>
                <Input
                  type="number"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                  placeholder="Ingrese la nueva tasa"
                  min={0}
                  step="0.01"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={updateTasaMutation.isPending}
                alignSelf="flex-end"
              >
                Actualizar
              </Button>
            </HStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  )
} 