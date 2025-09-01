import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicRoute = isLoginPage || isApiRoute;
  const isStaticFile = request.nextUrl.pathname.startsWith('/_next') || 
                      request.nextUrl.pathname === '/favicon.ico';

  // Permitir acceso a archivos estáticos y rutas públicas sin token
  if (isStaticFile || isPublicRoute) {
    return NextResponse.next();
  }

  // Si no hay token y no es una ruta pública, redirigir a login
  if (!token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  // Si hay token y es válido
  if (token === 'authenticated') {
    // Si estamos en login, redirigir a la página principal
    if (isLoginPage) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.headers.set('x-middleware-cache', 'no-cache');
      return response;
    }
    // Para cualquier otra ruta, permitir acceso
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  // Si el token no es válido, redirigir a login
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete('auth_token');
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 