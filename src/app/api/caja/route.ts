import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const transacciones = await prisma.transaccion.findMany({
      orderBy: {
        fecha: 'desc'
      }
    })
    return NextResponse.json(transacciones)
  } catch (error) {
    console.error('Error al obtener transacciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { fecha, concepto, moneda, entrada, salida, tasaCambio } = data

    // Validar datos
    if (!fecha || !concepto || !moneda || (entrada === undefined && salida === undefined)) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el último saldo
    const ultimaTransaccion = await prisma.transaccion.findFirst({
      orderBy: {
        fecha: 'desc'
      }
    })

    const saldoAnterior = ultimaTransaccion?.saldo || 0
    const nuevoSaldo = saldoAnterior + (entrada || 0) - (salida || 0)

    // Crear la transacción
    const transaccion = await prisma.transaccion.create({
      data: {
        fecha: new Date(fecha),
        concepto,
        moneda,
        entrada: entrada || 0,
        salida: salida || 0,
        saldo: nuevoSaldo,
        tasaCambio
      }
    })

    return NextResponse.json(transaccion)
  } catch (error) {
    console.error('Error al crear transacción:', error)
    return NextResponse.json(
      { error: 'Error al crear transacción' },
      { status: 500 }
    )
  }
} 