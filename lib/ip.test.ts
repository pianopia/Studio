import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { getClientIp, resolveClientIp } from "./ip.ts";

const withHeaders = (entries: Record<string, string>, ip?: string) => ({
  headers: new Headers(entries),
  ip
});

describe("getClientIp trust model", () => {
  const previousHops = process.env.TRUSTED_PROXY_HOPS;

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  afterEach(() => {
    if (previousHops === undefined) {
      delete process.env.TRUSTED_PROXY_HOPS;
    } else {
      process.env.TRUSTED_PROXY_HOPS = previousHops;
    }
  });

  it("does not trust spoofed X-Forwarded-For or X-Real-IP by default", () => {
    const request = withHeaders({
      "x-forwarded-for": "127.0.0.1, 198.51.100.10",
      "x-real-ip": "127.0.0.1"
    });
    assert.equal(getClientIp(request), "");
    assert.equal(resolveClientIp(request).source, "none");
  });

  it("prefers Cloudflare cf-connecting-ip over forged X-Forwarded-For", () => {
    const request = withHeaders({
      "cf-connecting-ip": "203.0.113.50",
      "x-forwarded-for": "127.0.0.1"
    });
    assert.equal(getClientIp(request), "203.0.113.50");
    assert.equal(resolveClientIp(request).source, "cf-connecting-ip");
  });

  it("uses x-vercel-forwarded-for when present", () => {
    const request = withHeaders({
      "x-vercel-forwarded-for": "203.0.113.51",
      "x-forwarded-for": "127.0.0.1"
    });
    assert.equal(getClientIp(request), "203.0.113.51");
  });

  it("uses request.ip when the platform provides it", () => {
    const request = withHeaders({ "x-forwarded-for": "127.0.0.1" }, "203.0.113.52");
    assert.equal(getClientIp(request), "203.0.113.52");
    assert.equal(resolveClientIp(request).source, "request-ip");
  });

  it("honors TRUSTED_PROXY_HOPS for a single reverse proxy (rightmost hop)", () => {
    process.env.TRUSTED_PROXY_HOPS = "1";
    const request = withHeaders({
      "x-forwarded-for": "127.0.0.1, 203.0.113.53"
    });
    assert.equal(getClientIp(request), "203.0.113.53");
    assert.equal(resolveClientIp(request).source, "trusted-proxy");
  });
});
