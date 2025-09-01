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
      
      // Verificar si es un error de configuración
      if (dbError instanceof Error && dbError.message.includes('DNS resolution')) {
        return NextResponse.json(
          { 
            error: 'Error de configuración de base de datos',
            details: 'Verifica que la DATABASE_URL esté configurada correctamente en Vercel',
            suggestion: 'Ve a Settings > Environment Variables en Vercel y configura DATABASE_URL'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos',
          details: dbError instanceof Error ? dbError.message : 'Error desconocido'
        },
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