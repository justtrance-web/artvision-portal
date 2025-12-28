import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Главная страница -> редирект на webapp.html
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/webapp.html", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
