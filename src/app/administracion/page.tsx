'use client'

import React, { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
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
  Text
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiHome } from 'react-icons/fi'
import ControlFinanciero from './components/ControlFinanciero'
import ReportesFinancieros from './components/ReportesFinancieros'
import GestionCaja from './components/GestionCaja'

export default function AdministracionPage() {
  const [tabIndex, setTabIndex] = useState(0)
  const [clave, setClave] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const router = useRouter()

  const handleSubmitClave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/unlock-key')
      const data = await response.json()
      const claveActual = data.key

      if (clave === claveActual) {
        setAutenticado(true)
        toast({
          title: 'Acceso autorizado',
          status: 'success',
          duration: 3000
        })
      } else {
        toast({
          title: 'Clave incorrecta',
          status: 'error',
          duration: 3000
        })
        setClave('')
      }
    } catch (error) {
      console.error('Error al verificar la clave:', error)
      toast({
        title: 'Error al verificar la clave',
        status: 'error',
        duration: 3000
      })
      setClave('')
    }
  }

  if (!autenticado) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.700"
        backdropFilter="blur(8px)"
        zIndex={999}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="xl"
          maxW="400px"
          w="full"
        >
          <Heading size="md" mb={6} textAlign="center">
            Acceso Restringido
          </Heading>
          <form onSubmit={handleSubmitClave}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Clave de acceso</FormLabel>
                <Input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full">
                Ingresar
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Button
        leftIcon={<FiHome />}
        colorScheme="blue"
        mb={6}
        onClick={() => router.push('/')}
      >
        Ir al Dashboard
      </Button>

      <Box bg="white" p={6} borderRadius="lg" boxShadow="md" mb={6}>
        <Heading size="lg" mb={6} color="blue.600">
          Administración
        </Heading>

        <Tabs isLazy variant="enclosed" onChange={(index) => setTabIndex(index)}>
          <TabList>
            <Tab>Control Financiero</Tab>
            <Tab>Reportes Financieros</Tab>
            <Tab>Gestión de Caja</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ControlFinanciero />
            </TabPanel>
            <TabPanel>
              <ReportesFinancieros />
            </TabPanel>
            <TabPanel>
              <GestionCaja />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  )
} 