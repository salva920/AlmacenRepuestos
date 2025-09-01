import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para Next.js 14
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando proceso de login...');
    
    const body = await request.json();
    const { username, password } = body;

    console.log('Datos recibidos:', { username, password: password ? '***' : 'vacío' });

    if (!username || !password) {
      console.log('Error: Faltan credenciales');
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar conexión a la base de datos
    try {
      await prisma.$connect();
      console.log('Conexión a la base de datos exitosa');
    } catch (dbError) {
      console.error('Error de conexión a la base de datos:', dbError);
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username }
    });

    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user || user.password !== password) {
      console.log('Credenciales inválidas');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    console.log('Login exitoso para usuario:', username);

    // Respuesta simple con token básico
    const response = NextResponse.json(
      { 
        auth: true,
        token: 'authenticated',
        message: 'Login exitoso'
      },
      { status: 200 }
    );

    // Establecer cookie simple
    response.cookies.set({
      name: 'auth_token',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error en el servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
} 