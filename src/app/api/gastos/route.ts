import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: {
        fecha: 'desc'
      }
    })
    return NextResponse.json(gastos)
  } catch (error) {
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { concepto, descripcion, monto, categoria, fecha, moneda } = data

    // Validar datos requeridos
    if (!concepto || !monto || !categoria || !fecha || !moneda) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Crear el gasto
    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        descripcion,
        monto: Number(monto),
        categoria,
        fecha: new Date(fecha),
        moneda
      }
    })

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: 'Error al crear gasto' },
      { status: 500 }
    )
  }
} 