import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define route groups
  const protectedRoutes = ['/home', '/dashboard', '/chat', '/file-manager', '/'];
  const authRoutes = ['/auth/signin', '/auth/signup'];

  // Check for user cookie
  const userCookie = request.cookies.get('user');
  const isAuthenticated = !!userCookie;

  // Extract locale from pathname (e.g., /en/home -> en)
  const segments = pathname.split('/');
  const locale = routing.locales.includes(segments[1] as any) ? segments[1] : 'en';
  
  // Check if current route is protected or auth-related
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`)
  );

  // Redirection logic
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
    signInUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
