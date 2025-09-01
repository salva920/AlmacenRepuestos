'use client'

import React from 'react'
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  useColorMode,
  useToast
} from '@chakra-ui/react'
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon
} from '@chakra-ui/icons'
import { FiShoppingCart, FiUsers, FiPackage, FiDollarSign, FiSettings, FiLogOut } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const router = useRouter()
  const toast = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        router.push('/login');
      } else {
        throw new Error('Error al cerrar sesión');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Text
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            fontWeight="bold"
            fontSize="xl"
            cursor="pointer"
            onClick={() => router.push('/')}
          >
            Repuestos
          </Text>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <Stack direction={'row'} spacing={4}>
              <Button
                variant="ghost"
                leftIcon={<FiShoppingCart />}
                onClick={() => router.push('/ventas')}
              >
                Ventas
              </Button>
              <Button
                variant="ghost"
                leftIcon={<FiUsers />}
                onClick={() => router.push('/clientes')}
              >
                Clientes
              </Button>
              <Button
                variant="ghost"
                leftIcon={<FiPackage />}
                onClick={() => router.push('/productos')}
              >
                Productos
              </Button>
              <Button
                variant="ghost"
                leftIcon={<FiDollarSign />}
                onClick={() => router.push('/administracion')}
              >
                Administración
              </Button>
            </Stack>
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
        >
          <IconButton
            aria-label="Cambiar tema"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          <IconButton
            aria-label="Cerrar sesión"
            icon={<FiLogOut />}
            onClick={handleLogout}
            variant="ghost"
            colorScheme="red"
          />
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav onLogout={handleLogout} />
      </Collapse>
    </Box>
  )
}

const MobileNav = ({ onLogout }: { onLogout: () => void }) => {
  const router = useRouter()
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      <Button
        variant="ghost"
        leftIcon={<FiShoppingCart />}
        onClick={() => router.push('/ventas')}
      >
        Ventas
      </Button>
      <Button
        variant="ghost"
        leftIcon={<FiUsers />}
        onClick={() => router.push('/clientes')}
      >
        Clientes
      </Button>
      <Button
        variant="ghost"
        leftIcon={<FiPackage />}
        onClick={() => router.push('/productos')}
      >
        Productos
      </Button>
      <Button
        variant="ghost"
        leftIcon={<FiDollarSign />}
        onClick={() => router.push('/administracion')}
      >
        Administración
      </Button>
      <Button
        variant="ghost"
        leftIcon={<FiLogOut />}
        onClick={onLogout}
        colorScheme="red"
      >
        Cerrar Sesión
      </Button>
    </Stack>
  )
} 