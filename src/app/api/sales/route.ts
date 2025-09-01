import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                lotes: {
                  orderBy: {
                    fechaIngreso: 'asc'
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.customerId) {
      return NextResponse.json(
        { error: 'El ID del cliente es requerido' },
        { status: 400 }
      );
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener al menos un producto' },
        { status: 400 }
      );
    }

    // Validar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Iniciar transacción
    const result = await prisma.$transaction(async (tx) => {
      let totalVenta = 0;
      let gananciaTotal = 0;
      const itemsToCreate = [];

      // Crear primero la venta
      const sale = await tx.sale.create({
        data: {
          customer: {
            connect: { id: data.customerId }
          },
          total: 0, // Se actualizará después
          ganancia: 0, // Se actualizará después
          status: data.paymentType === 'contado' ? 'completed' : (data.status || 'pending'),
          invoiceNumber: data.invoiceNumber || `FACT-${Date.now()}`,
          paymentType: data.paymentType || 'contado',
          paymentMethod: data.paymentMethod || 'efectivo',
          bank: data.bank || null,
          amountPaid: data.paymentType === 'contado' ? 0 : (data.amountPaid || 0)
        }
      });

      for (const item of data.items) {
        // Validar campos del item
        if (!item.productId) {
          throw new Error('El ID del producto es requerido');
        }

        if (!item.quantity || item.quantity <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        // Obtener el producto y sus lotes ordenados por fecha
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            lotes: {
              where: {
                stockActual: { gt: 0 }
              },
              orderBy: {
                fechaIngreso: 'asc'
              }
            }
          }
        });

        if (!product) {
          throw new Error('Producto no encontrado');
        }

        let cantidadRestante = item.quantity;
        let gananciaItem = 0;
        const precioVenta = item.price || product.price;

        // Procesar lotes FIFO
        for (const lote of product.lotes) {
          if (cantidadRestante <= 0) break;

          const cantidadDisponible = Math.min(cantidadRestante, lote.stockActual);
          const precioCompra = lote.precio;
          
          // Calcular ganancia para este lote
          const gananciaLote = (precioVenta - precioCompra) * cantidadDisponible;
          gananciaItem += gananciaLote;
          
          // Actualizar stock del lote
          await tx.loteProducto.update({
            where: { id: lote.id },
            data: {
              stockActual: lote.stockActual - cantidadDisponible
            }
          });

          cantidadRestante -= cantidadDisponible;
        }

        if (cantidadRestante > 0) {
          throw new Error(`Stock insuficiente para el producto ${product.name}`);
        }

        // Crear el item de venta
        const saleItem = await tx.saleItem.create({
          data: {
            sale: {
              connect: { id: sale.id }
            },
            product: {
              connect: { id: item.productId }
            },
            quantity: item.quantity,
            price: precioVenta,
            ganancia: gananciaItem
          }
        });

        itemsToCreate.push(saleItem);
        totalVenta += precioVenta * item.quantity;
        gananciaTotal += gananciaItem;

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock - item.quantity
          }
        });
      }

      // Actualizar la venta con los totales
      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          total: totalVenta,
          ganancia: gananciaTotal,
          amountPaid: data.paymentType === 'contado' ? totalVenta : (data.amountPaid || 0)
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                include: {
                  lotes: {
                    orderBy: {
                      fechaIngreso: 'asc'
                    }
                  }
                }
              }
            }
          }
        }
      });

      return updatedSale;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al crear venta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear venta' },
      { status: 500 }
    );
  }
} 