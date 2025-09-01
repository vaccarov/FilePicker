import { NextRequest, NextResponse } from 'next/server';

const locales: string[] = ['en', 'fr'];

export function middleware(request: NextRequest) {
  const { pathname }: { pathname: string } = request.nextUrl;
  const pathnameHasLocale: boolean = locales.some(
    (locale: string) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameHasLocale) return;

  const locale: string = 'en';
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};