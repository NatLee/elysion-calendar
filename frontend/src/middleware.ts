import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that proxies API requests from localhost:3000/api/* to backend:8000/api/*
 * Only active in development environment
 * @param request - The incoming request object
 */
export function middleware(request: NextRequest) {
  // Only run in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next();
  }

  // Get API URL from environment variable (http://backend:8000/api)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not defined');
    return NextResponse.next();
  }

  try {
    // Extract the full pathname and search params
    const { pathname, search } = request.nextUrl;
    
    // Construct the target URL by appending the path after /api to the API URL
    const apiUrlWithoutTrailingSlash = apiUrl.endsWith('/') 
      ? apiUrl.slice(0, -1) 
      : apiUrl;
    
    const targetUrl = `${apiUrlWithoutTrailingSlash}${pathname}${search}`;
    
    console.log(`Proxying request from ${pathname}${search} to ${targetUrl}`);
    
    // Use rewrite() to proxy the request to the target URL
    // This is cleaner than manually fetching and constructing a response
    return NextResponse.rewrite(new URL(targetUrl));
  } catch (error: unknown) { // Properly type the error parameter
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API proxy error:', errorMessage);
    
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to proxy request', 
      details: errorMessage 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Configure which paths should be processed by this middleware
 */
export const config = {
  matcher: '/api/:path*',
};