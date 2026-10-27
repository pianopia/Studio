const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
export const normalizeIp = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const unbracketed =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;

  const lower = unbracketed.toLowerCase();
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice("::ffff:".length);
    if (IPV4_REGEX.test(mapped)) {
      return mapped;
    }
  }

  return lower;
};

const isPlausibleIpv6 = (ip: string): boolean => {
  if (!ip.includes(":")) {
    return false;
  }
  if (ip.length > 45) {
    return false;
  }
  return /^[\da-f:.]+$/i.test(ip);
};

export const isValidIp = (ip: string): boolean =>
  IPV4_REGEX.test(ip) || isPlausibleIpv6(ip);

/**
 * Picks the client IP from an X-Forwarded-For chain when the app sits behind
 * trusted reverse proxies that append the remote address (e.g. nginx
 * proxy_add_x_forwarded_for). Untrusted client-supplied values are leftmost;
 * the rightmost hop added by the first proxy is used when trustedHops === 1.
 */
export const clientIpFromForwardedFor = (
  forwardedFor: string,
  trustedHops: number
): string => {
  const hops = Math.max(1, Math.trunc(trustedHops));
  const parts = forwardedFor
    .split(",")
    .map((part) => normalizeIp(part))
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const index = Math.max(0, parts.length - hops);
  const candidate = parts[index] ?? "";
  return isValidIp(candidate) ? candidate : "";
};
