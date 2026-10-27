import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  clientIpFromForwardedFor,
  isValidIp,
  normalizeIp
} from "@/lib/ip-address";

export { clientIpFromForwardedFor, normalizeIp } from "@/lib/ip-address";

export const getClientIp = (request: NextRequest): string => {
  if (!env.TRUST_PROXY) {
    return "";
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const fromChain = clientIpFromForwardedFor(
      forwardedFor,
      env.TRUSTED_PROXY_HOPS
    );
    if (fromChain) {
      return fromChain;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    const normalized = normalizeIp(realIp);
    if (isValidIp(normalized)) {
      return normalized;
    }
  }

  return "";
};
