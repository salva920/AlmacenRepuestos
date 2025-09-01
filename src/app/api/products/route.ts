import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products
// GET /api/products/:id
export async function GET(
  request: Request,
  { params }: { params?: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')

    // Si hay un ID en los parámetros, obtener un producto específico
    if (params?.id) {
      const product = await prisma.product.findUnique({
        where: { id: params.id }
      });
      if (!product) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    // Si no hay ID, obtener todos los productos
    const products = await prisma.product.findMany({
      include: {
        lotes: include === 'lotes' ? {
          orderBy: {
            fechaIngreso: 'asc'
          }
        } : undefined
      }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/products
// POST /api/products/:id/ingreso
export async function POST(
  request: Request,
  { params }: { params?: { id: string } }
) {
  try {
    const data = await request.json();

    // Si hay un ID en los parámetros, es una operación de ingreso
    if (params?.id) {
      const { cantidad } = data;

      if (!cantidad || cantidad <= 0) {
        return NextResponse.json(
          { error: 'La cantidad debe ser mayor a 0' },
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
            precio: parseFloat(data.price)
          }
        })
      ]);

      return NextResponse.json({
        product: updatedProduct,
        lote: newLote
      });
    }

    // Si no hay ID, es una creación de producto
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        minStock: parseInt(data.minStock)
      }
    });

    // Crear el lote inicial
    await prisma.loteProducto.create({
      data: {
        cantidad: parseInt(data.stock),
        stockActual: parseInt(data.stock),
        precio: parseFloat(data.price),
        product: {
          connect: {
            id: product.id
          }
        }
      }
    });

    // Obtener el producto con sus lotes
    const productWithLotes = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        lotes: {
          orderBy: {
            fechaIngreso: 'asc'
          }
        }
      }
    });

    return NextResponse.json(productWithLotes);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

// PUT /api/products/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        minStock: parseInt(data.minStock)
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

// DELETE /api/products/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Verificar si el producto está siendo utilizado en alguna venta
    const saleItems = await prisma.saleItem.findMany({
      where: { productId: params.id }
    });

    if (saleItems.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el producto porque está siendo utilizado en ventas' },
        { status: 400 }
      );
    }

    // Eliminar los lotes asociados al producto
    await prisma.loteProducto.deleteMany({
      where: { productId: params.id }
    });

    // Eliminar el producto
    await prisma.product.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
} 