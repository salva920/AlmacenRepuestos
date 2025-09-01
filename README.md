# Sistema de Gestión de Repuestos

Sistema web para la gestión de inventario y ventas de repuestos.

## Características

- Control de inventario en tiempo real
- Alertas de stock bajo
- Procesamiento de ventas
- Dashboard administrativo
- Gestión de clientes
- Facturación automática

## Requisitos

- Node.js 18.x o superior
- PostgreSQL
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone [url-del-repositorio]
cd repuestos-app
```

2. Instalar dependencias:
```bash
npm install
# o
yarn install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/repuestos_db"
```

4. Inicializar la base de datos:
```bash
npx prisma migrate dev
```

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

## Estructura del Proyecto

```
src/
  ├── app/              # Páginas y componentes principales
  ├── components/       # Componentes reutilizables
  ├── lib/             # Utilidades y configuraciones
  └── prisma/          # Esquema y migraciones de la base de datos
```

## Despliegue en Vercel

1. Crear una cuenta en Vercel
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno en Vercel
4. Desplegar

## Tecnologías Utilizadas

- Next.js 14
- TypeScript
- Prisma
- PostgreSQL
- Chakra UI
- React Query # AlmacenRepuestos
