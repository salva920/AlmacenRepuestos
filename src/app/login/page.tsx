'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  useColorModeValue,
  Text,
  Image,
  Flex,
  InputGroup,
  InputLeftElement,
  Icon
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiTool } from 'react-icons/fi';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (data.auth) {
        localStorage.setItem('isLoggedIn', 'true');
        
        toast({
          title: 'Login exitoso',
          description: 'Redirigiendo al sistema...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      
      toast({
        title: 'Error de autenticación',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/auth/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al inicializar el sistema');
      }

      toast({
        title: 'Sistema inicializado',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al inicializar:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al inicializar el sistema',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar el estado del sistema');
      }

      // Mostrar información detallada
      const recommendations = data.recommendations || [];
      const message = recommendations.length > 0 
        ? recommendations.join('\n• ') 
        : 'Sistema funcionando correctamente';

      toast({
        title: 'Estado del Sistema',
        description: message,
        status: data.status === 'ok' ? 'success' : 'warning',
        duration: 8000,
        isClosable: true,
      });

      // Log detallado en consola
      console.log('Health Check Result:', data);
    } catch (error) {
      console.error('Error en health check:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al verificar el sistema',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      bgGradient="linear(to-br, blue.500, blue.700)"
      align="center"
      justify="center"
      p={4}
    >
      <Container maxW="container.sm">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            bg={useColorModeValue('white', 'gray.800')}
            rounded="xl"
            overflow="hidden"
            boxShadow="2xl"
          >
            {/* Lado izquierdo - Imagen y título */}
            <Box
              w={{ base: '100%', md: '40%' }}
              bg="blue.600"
              p={8}
              color="white"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
            >
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Icon as={FiTool} w={16} h={16} mb={4} />
              </MotionBox>
              <Heading size="lg" mb={2}>Sistema de Repuestos</Heading>
              <Text fontSize="sm" opacity={0.8}>
                Gestión eficiente de inventario y ventas
              </Text>
            </Box>

            {/* Lado derecho - Formulario */}
            <Box w={{ base: '100%', md: '60%' }} p={8}>
              <MotionVStack
                spacing={6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Heading size="lg" color="blue.600">Iniciar Sesión</Heading>
                <Box 
                  p={4} 
                  bg="blue.50" 
                  rounded="md" 
                  border="1px solid" 
                  borderColor="blue.200"
                  fontSize="sm"
                >
                  <Text fontWeight="bold" color="blue.700" mb={2}>
                    Credenciales por defecto:
                  </Text>
                  <Text color="blue.600">Usuario: <strong>vladi</strong></Text>
                  <Text color="blue.600">Contraseña: <strong>vladi2025</strong></Text>
                </Box>
                <Box as="form" onSubmit={handleSubmit} w="full">
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Usuario</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiUser} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ingrese su usuario"
                          autoComplete="username"
                          size="lg"
                          rounded="md"
                          _focus={{
                            borderColor: 'blue.500',
                            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                          }}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Contraseña</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiLock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ingrese su contraseña"
                          autoComplete="current-password"
                          size="lg"
                          rounded="md"
                          _focus={{
                            borderColor: 'blue.500',
                            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                          }}
                        />
                      </InputGroup>
                    </FormControl>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      width="full"
                      isLoading={isLoading}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                      }}
                      transition="all 0.2s"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      colorScheme="blue"
                      size="md"
                      width="full"
                      isLoading={isInitializing}
                      onClick={handleInitialize}
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'md',
                      }}
                      transition="all 0.2s"
                    >
                      Inicializar Sistema
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      colorScheme="gray"
                      size="sm"
                      width="full"
                      isLoading={isCheckingHealth}
                      onClick={handleHealthCheck}
                      _hover={{
                        transform: 'translateY(-1px)',
                        boxShadow: 'sm',
                      }}
                      transition="all 0.2s"
                    >
                      Verificar Estado del Sistema
                    </Button>
                  </VStack>
                </Box>
              </MotionVStack>
            </Box>
          </Flex>
        </MotionBox>
      </Container>
    </Flex>
  );
} 