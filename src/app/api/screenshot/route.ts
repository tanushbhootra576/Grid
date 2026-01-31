import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Query interface (documentation only) removed to avoid unused lint error.

function validateAndNormalize(params: URLSearchParams):
  | {
      url: string;
      fullPage: boolean;
      width: number;
      height: number;
      type: "png" | "jpeg" | "webp";
      quality?: number;
      waitMs: number;
    }
  | { error: string; status: number } {
  const url = params.get("url");
  if (!url) return { error: "Missing url parameter", status: 400 };
  try {
    // basic URL validation
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { error: "Only http/https protocols supported", status: 400 };
    }
  } catch {
    return { error: "Invalid URL format", status: 400 };
  }
  const fullPage = params.get("full") === "1" || params.get("full") === "true";
  const width = Math.min(
    4096,
    Math.max(320, Number(params.get("width")) || 1280)
  );
  const height = Math.min(
    4096,
    Math.max(320, Number(params.get("height")) || 800)
  );
  const typeRaw = (params.get("type") || "png").toLowerCase();
  const typeList: Array<"png" | "jpeg" | "webp"> = ["png", "jpeg", "webp"];
  const type: "png" | "jpeg" | "webp" = typeList.includes(
    typeRaw as "png" | "jpeg" | "webp"
  )
    ? (typeRaw as "png" | "jpeg" | "webp")
    : "png";
  const qualityParam = params.get("quality");
  let quality: number | undefined;
  if (qualityParam) {
    const q = Number(qualityParam);
    if (!Number.isFinite(q) || q < 1 || q > 100) {
      return { error: "quality must be 1-100", status: 400 };
    }
    if (type === "png") {
      return { error: "quality only applies to jpeg/webp", status: 400 };
    }
    quality = q;
  }
  const waitMs = Math.min(10000, Math.max(0, Number(params.get("wait")) || 0));
  return { url, fullPage, width, height, type, quality, waitMs };
}

function getMShotsUrl(url: string, width: number) {
  // Free, no-key screenshot service (best-effort). It can be slow on first request.
  // Docs/usage are informal, but it's widely used for simple thumbnails.
  const w = Math.min(2000, Math.max(320, width || 1280));
  return `https://s0.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${w}`;
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const norm = validateAndNormalize(params);
  if ("error" in norm) {
    return NextResponse.json({ error: norm.error }, { status: norm.status });
  }

  const started = Date.now();
  try {
    // NOTE: We intentionally do NOT launch Chromium/Puppeteer here.
    // Vercel Serverless often lacks required shared libs (e.g. libnss3.so), causing crashes.
    // Instead we use a free external thumbnail service.

    const upstreamUrl = getMShotsUrl(norm.url, norm.width);
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 15000);
    const upstream = await fetch(upstreamUrl, {
      signal: ac.signal,
      // Avoid caching broken responses for long.
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!upstream.ok || !upstream.body) {
      throw new Error(`Upstream screenshot failed (${upstream.status})`);
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    return new NextResponse(upstream.body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
        "X-Screenshot-Time": String(Date.now() - started),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[screenshot.GET] Error", message);
    const showDetail =
      process.env.NODE_ENV !== "production" && !process.env.VERCEL;
    const detail = showDetail ? escapeHtml(message).slice(0, 100) : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400" role="img" aria-label="Screenshot error"><rect width="800" height="400" fill="#18181b"/><text x="50%" y="40%" fill="#fafafa" font-size="22" font-family="system-ui, sans-serif" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text>${
      detail
        ? `<text x="50%" y="58%" fill="#9ca3af" font-size="14" font-family="system-ui, sans-serif" dominant-baseline="middle" text-anchor="middle">${detail}</text>`
        : ""
    }</svg>`;
    // Return 200 so <img> does not show broken icon
    return new NextResponse(svg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeHtml(str: string) {
  return str.replace(
    /[&<>\"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c)
  );
}
