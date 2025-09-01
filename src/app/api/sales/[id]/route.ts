import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    return NextResponse.json({ error: 'Error al obtener venta' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const sale = await prisma.sale.findUnique({
      where: { id: params.id }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Si se está actualizando el monto abonado
    if (data.amountPaid !== undefined) {
      const newAmountPaid = data.amountPaid;
      const total = sale.total;
      
      // Si el nuevo monto abonado es igual o mayor al total, actualizar el estado a completado
      const newStatus = newAmountPaid >= total ? 'completed' : sale.status;

      const updatedSale = await prisma.sale.update({
        where: { id: params.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return NextResponse.json(updatedSale);
    }

    // Si se está actualizando el estado manualmente
    if (data.status) {
      const updatedSale = await prisma.sale.update({
        where: { id: params.id },
        data: { status: data.status },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return NextResponse.json(updatedSale);
    }

    return NextResponse.json({ error: 'Datos de actualización inválidos' }, { status: 400 });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    return NextResponse.json({ error: 'Error al actualizar venta' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { items: true }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Restaurar el stock de los productos
    for (const item of sale.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    // Eliminar la venta
    await prisma.sale.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    return NextResponse.json({ error: 'Error al eliminar venta' }, { status: 500 });
  }
} 