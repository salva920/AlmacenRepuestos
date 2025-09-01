import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers
// GET /api/customers/:id
// GET /api/customers/:id/sales
export async function GET(
  request: Request,
  { params }: { params?: { id: string } }
) {
  try {
    // Si no hay ID, obtener todos los clientes
    if (!params?.id) {
      const customers = await prisma.customer.findMany();
      return NextResponse.json(customers);
    }

    // Verificar si el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: params.id }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si la URL termina en /sales, obtener las ventas del cliente
    if (request.url.endsWith('/sales')) {
      const sales = await prisma.sale.findMany({
        where: { customerId: params.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return NextResponse.json(sales);
    }

    // Si no, devolver el cliente
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Datos recibidos:', data);

    // Validar campos requeridos
    if (!data.name || !data.cedula) {
      console.log('Campos requeridos faltantes:', { name: !data.name, cedula: !data.cedula });
      return NextResponse.json(
        { error: 'Nombre y cédula son campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con la misma cédula
    const existingCustomerByCedula = await prisma.customer.findUnique({
      where: { cedula: data.cedula }
    });

    if (existingCustomerByCedula) {
      console.log('Cliente ya existe con cédula:', data.cedula);
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con el mismo email (si se proporciona)
    if (data.email) {
      const existingCustomerByEmail = await prisma.customer.findUnique({
        where: { email: data.email }
      });

      if (existingCustomerByEmail) {
        console.log('Cliente ya existe con email:', data.email);
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email' },
          { status: 400 }
        );
      }
    }

    console.log('Creando nuevo cliente...');
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        cedula: data.cedula,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null
      }
    });
    console.log('Cliente creado exitosamente:', customer);

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error detallado al crear cliente:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al crear cliente: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Validar campos requeridos
    if (!data.name || !data.cedula) {
      return NextResponse.json(
        { error: 'Nombre y cédula son campos requeridos' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        cedula: data.cedula,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null
      }
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/customers/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
} 