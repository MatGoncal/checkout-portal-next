import { NextResponse } from 'next/server';

export function middleware() {
  if (process.env.ENABLE_SIMULATOR !== 'true') {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/simulator/:path*',
};
