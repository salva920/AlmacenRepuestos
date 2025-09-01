import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ultimaTasa = await prisma.tasaCambio.findFirst({
      orderBy: {
        fecha: 'desc'
      }
    })

    if (!ultimaTasa) {
      return NextResponse.json({ error: 'No hay tasa de cambio registrada' }, { status: 404 })
    }

    return NextResponse.json(ultimaTasa)
  } catch (error) {
    console.error('Error al obtener tasa de cambio:', error)
    return NextResponse.json({ error: 'Error al obtener tasa de cambio' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { tasa } = data

    if (!tasa || typeof tasa !== 'number' || tasa <= 0) {
      return NextResponse.json(
        { error: 'La tasa debe ser un número positivo' },
        { status: 400 }
      )
    }

    const nuevaTasa = await prisma.tasaCambio.create({
      data: {
        tasa,
        fecha: new Date()
      }
    })

    return NextResponse.json(nuevaTasa)
  } catch (error) {
    console.error('Error al crear tasa de cambio:', error)
    return NextResponse.json({ error: 'Error al crear tasa de cambio' }, { status: 500 })
  }
} 