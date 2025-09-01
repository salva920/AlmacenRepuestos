import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { cantidad, precio } = await request.json();

    if (!cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!precio || precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Crear un nuevo lote y actualizar el stock del producto
    const [updatedProduct, newLote] = await prisma.$transaction([
      prisma.product.update({
        where: { id: params.id },
        data: {
          stock: {
            increment: cantidad
          }
        },
        include: {
          lotes: {
            orderBy: {
              fechaIngreso: 'desc'
            },
            select: {
              id: true,
              cantidad: true,
              stockActual: true,
              precio: true,
              fechaIngreso: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }),
      prisma.loteProducto.create({
        data: {
          product: {
            connect: {
              id: params.id
            }
          },
          cantidad: cantidad,
          stockActual: cantidad,
          precio: precio
        }
      })
    ]);

    return NextResponse.json({
      product: updatedProduct,
      lote: newLote
    });
  } catch (error) {
    console.error('Error al procesar el ingreso:', error);
    return NextResponse.json(
      { error: 'Error al procesar el ingreso' },
      { status: 500 }
    );
  }
} 