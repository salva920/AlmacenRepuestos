import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Verificando estado del sistema...');
    
    // Verificar variables de entorno
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const databaseUrlPreview = hasDatabaseUrl 
      ? process.env.DATABASE_URL.substring(0, 20) + '...' 
      : 'No configurada';
    
    console.log('DATABASE_URL configurada:', hasDatabaseUrl);
    console.log('Preview DATABASE_URL:', databaseUrlPreview);
    
    // Verificar conexión a la base de datos
    let dbConnection = false;
    let dbError = null;
    
    try {
      await prisma.$connect();
      dbConnection = true;
      console.log('Conexión a la base de datos exitosa');
    } catch (error) {
      dbConnection = false;
      dbError = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error de conexión a la base de datos:', error);
    }
    
    // Verificar si existe el usuario admin
    let userExists = false;
    let userCount = 0;
    
    if (dbConnection) {
      try {
        const users = await prisma.user.findMany();
        userCount = users.length;
        userExists = users.some(user => user.username === 'vladi');
        console.log('Usuarios encontrados:', userCount);
        console.log('Usuario vladi existe:', userExists);
      } catch (error) {
        console.error('Error al consultar usuarios:', error);
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl,
        databaseUrlPreview
      },
      database: {
        connected: dbConnection,
        error: dbError,
        userCount,
        adminUserExists: userExists
      },
      recommendations: !hasDatabaseUrl ? [
        'Configurar DATABASE_URL en Vercel Environment Variables',
        'Formato: mongodb+srv://username:password@cluster.mongodb.net/database'
      ] : !dbConnection ? [
        'Verificar que la URL de MongoDB Atlas sea correcta',
        'Verificar que el cluster esté activo en MongoDB Atlas',
        'Verificar que la IP 0.0.0.0/0 esté permitida en Network Access'
      ] : !userExists ? [
        'Ejecutar /api/auth/init para crear el usuario admin'
      ] : [
        'Sistema funcionando correctamente'
      ]
    });
  } catch (error) {
    console.error('Error en health check:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
