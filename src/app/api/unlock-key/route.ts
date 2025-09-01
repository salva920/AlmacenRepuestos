import { NextResponse } from 'next/server'

export async function GET() {
  // La clave es "admin123"
  return NextResponse.json({ key: 'admin123' })
} 