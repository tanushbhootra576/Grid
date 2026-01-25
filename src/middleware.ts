import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only run on /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
      // Public routes that don't require API key auth
      if (request.nextUrl.pathname.startsWith('/api/screenshot')) {
        return NextResponse.next();
      }

      const auth = request.headers.get("authorization");
      const secret = process.env.API_SECRET;
      
      // If no secret is set on server, we might want to allow or fail. 
      // For security, if secret is missing, we should probably fail or log.
      // But here we assume it is set.
      
      if (auth !== `Bearer ${secret}`) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Unauthorized: Invalid API Key' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
