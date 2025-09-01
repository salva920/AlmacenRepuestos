import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para Next.js 14
export const dynamic = 'force-dynamic';

async function initializeAdmin() {
  try {
    console.log('Iniciando proceso de inicialización del admin...');
    
    // Verificar si ya existe el usuario admin
    console.log('Buscando usuario existente...');
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'vladi' }
    });
    console.log('Resultado de búsqueda:', existingAdmin);

    if (existingAdmin) {
      console.log('Usuario admin encontrado:', existingAdmin);
      return NextResponse.json({
        message: 'El usuario admin ya existe',
        user: {
          id: existingAdmin.id,
          username: existingAdmin.username,
          role: existingAdmin.role
        }
      });
    }

    // Crear el usuario admin
    console.log('Creando nuevo usuario admin...');
    const admin = await prisma.user.create({
      data: {
        username: 'vladi',
        password: 'vladi2025',
        role: 'admin'
      }
    });
    console.log('Usuario admin creado:', admin);

    return NextResponse.json({
      message: 'Usuario admin creado exitosamente',
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error detallado al crear usuario admin:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario admin', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Exportar los handlers de manera más explícita
export const GET = async (request: NextRequest) => {
  console.log('GET request recibida en /api/auth/init');
  return initializeAdmin();
};

export const POST = async (request: NextRequest) => {
  console.log('POST request recibida en /api/auth/init');
  return initializeAdmin();
}; 