import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Fetch Supabase session. This will refresh it if needed and update cookies.
  await supabase.auth.getSession(); 
  // IMPORTANT: The getSession() call here is crucial. It ensures that if NextAuth has a valid session
  // (and your NextAuth adapter correctly creates/updates the Supabase user and their session),
  // this call will effectively refresh and propagate the Supabase auth cookies.

  const { pathname } = req.nextUrl;

  // Allow public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/bpa-public') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/anmelden') ||
    pathname.startsWith('/abmelden') ||
    pathname.startsWith('/tour-form')
  ) {
    return response;
  }

  // Check for valid session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    // Redirect to login page
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/anmelden';
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|static|favicon.ico|images/).*)',
  ],
}; 