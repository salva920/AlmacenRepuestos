import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  console.log('Inicializando Prisma Client...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma; 