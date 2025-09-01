import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Obtener la transacción a eliminar
    const transaccion = await prisma.transaccion.findUnique({
      where: { id }
    })

    if (!transaccion) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la transacción
    await prisma.transaccion.delete({
      where: { id }
    })

    // Recalcular saldos de las transacciones posteriores
    const transaccionesPosteriores = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gt: transaccion.fecha
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    })

    let saldoAcumulado = 0
    for (const t of transaccionesPosteriores) {
      saldoAcumulado += t.entrada - t.salida
      await prisma.transaccion.update({
        where: { id: t.id },
        data: { saldo: saldoAcumulado }
      })
    }

    return NextResponse.json({ message: 'Transacción eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar transacción:', error)
    return NextResponse.json(
      { error: 'Error al eliminar transacción' },
      { status: 500 }
    )
  }
} 