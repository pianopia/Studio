import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { allowedIpSet } from "@/lib/env";
import { getClientIp } from "@/lib/ip";

export function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const bypass = process.env.NODE_ENV === "development" && !ip;

  if (bypass || allowedIpSet.has(ip)) {
    return NextResponse.next();
  }

  return new NextResponse("Forbidden: IP not allowed", { status: 403 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
