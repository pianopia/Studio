/** Where `getClientIp` resolved the address (for tests and debugging). */
export type ClientIpSource =
  | "request-ip"
  | "cf-connecting-ip"
  | "x-vercel-forwarded-for"
  | "trusted-proxy"
  | "none";

export type ClientIpResult = {
  ip: string;
  source: ClientIpSource;
};

export type IpRequest = {
  headers: Headers;
  ip?: string | null;
};

const parseTrustedProxyHops = (): number => {
  const raw = process.env.TRUSTED_PROXY_HOPS ?? "0";
  const hops = Number.parseInt(raw, 10);
  if (!Number.isFinite(hops) || hops < 0) {
    return 0;
  }
  return hops;
};

/**
 * Resolves the client IP without trusting client-spoofable forwarding headers.
 *
 * Trust model (first match wins):
 * 1. `request.ip` when the host sets it (e.g. Vercel).
 * 2. `cf-connecting-ip` — set by Cloudflare on traffic through their edge.
 * 3. `x-vercel-forwarded-for` — set by Vercel's edge (first hop only).
 * 4. `x-forwarded-for` only when `TRUSTED_PROXY_HOPS` > 0: take the entry
 *    `TRUSTED_PROXY_HOPS` positions from the right (single nginx with
 *    `proxy_add_x_forwarded_for` → use `1`, which selects the rightmost hop).
 *
 * `x-real-ip` is intentionally ignored — it is trivially spoofed without a
 * trusted reverse proxy in front of the app.
 */
export const resolveClientIp = (request: IpRequest): ClientIpResult => {
  if (request.ip) {
    return { ip: request.ip.trim(), source: "request-ip" };
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    const ip = cfIp.trim();
    if (ip) {
      return { ip, source: "cf-connecting-ip" };
    }
  }

  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const ip = vercelIp.split(",")[0]?.trim();
    if (ip) {
      return { ip, source: "x-vercel-forwarded-for" };
    }
  }

  const hops = parseTrustedProxyHops();
  if (hops > 0) {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const parts = xff.split(",").map((part) => part.trim()).filter(Boolean);
      const index = parts.length - hops;
      if (index >= 0 && index < parts.length) {
        return { ip: parts[index], source: "trusted-proxy" };
      }
    }
  }

  return { ip: "", source: "none" };
};

export const getClientIp = (request: IpRequest): string => {
  return resolveClientIp(request).ip;
};
