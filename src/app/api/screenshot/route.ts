import { NextRequest, NextResponse } from 'next/server';

// We conditionally require either full puppeteer (local dev) or puppeteer-core + @sparticuz/chromium (Vercel serverless).
// Avoid top-level imports of heavy modules for edge; we force Node.js runtime anyway.
// Force Node.js runtime (not edge) so native modules / larger binaries can run.
export const runtime = 'nodejs';

// Query interface (documentation only) removed to avoid unused lint error.

function validateAndNormalize(params: URLSearchParams): {
  url: string; fullPage: boolean; width: number; height: number; type: 'png' | 'jpeg' | 'webp'; quality?: number; waitMs: number;
} | { error: string; status: number } {
  const url = params.get('url');
  if (!url) return { error: 'Missing url parameter', status: 400 };
  try {
    // basic URL validation
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Only http/https protocols supported', status: 400 };
    }
  } catch {
    return { error: 'Invalid URL format', status: 400 };
  }
  const fullPage = params.get('full') === '1' || params.get('full') === 'true';
  const width = Math.min(4096, Math.max(320, Number(params.get('width')) || 1280));
  const height = Math.min(4096, Math.max(320, Number(params.get('height')) || 800));
  const typeRaw = (params.get('type') || 'png').toLowerCase();
  const typeList: Array<'png' | 'jpeg' | 'webp'> = ['png', 'jpeg', 'webp'];
  const type: 'png' | 'jpeg' | 'webp' = typeList.includes(typeRaw as 'png' | 'jpeg' | 'webp') ? (typeRaw as 'png' | 'jpeg' | 'webp') : 'png';
  const qualityParam = params.get('quality');
  let quality: number | undefined;
  if (qualityParam) {
    const q = Number(qualityParam);
    if (!Number.isFinite(q) || q < 1 || q > 100) {
      return { error: 'quality must be 1-100', status: 400 };
    }
    if (type === 'png') {
      return { error: 'quality only applies to jpeg/webp', status: 400 };
    }
    quality = q;
  }
  const waitMs = Math.min(10000, Math.max(0, Number(params.get('wait')) || 0));
  return { url, fullPage, width, height, type, quality, waitMs };
}

async function getBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;
  if (isServerless) {
    // Lazy import to keep local dev simpler and reduce cold start impact.
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');
    const executablePath = await chromium.default.executablePath();
    return puppeteerCore.default.launch({
      executablePath,
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 800 },
      headless: chromium.default.headless,
    });
  } else {
    const puppeteer = (await import('puppeteer')).default;
    return puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions'
      ],
      defaultViewport: { width: 1280, height: 800 }
    });
  }
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const norm = validateAndNormalize(params);
  if ('error' in norm) {
    return NextResponse.json({ error: norm.error }, { status: norm.status });
  }

  let browser: Awaited<ReturnType<typeof getBrowser>> | null = null;
  const started = Date.now();
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: norm.width, height: norm.height });

    // Navigation: networkidle0 can hang on sites with open connections, use domcontentloaded
    try {
      await page.goto(norm.url, { waitUntil: ['domcontentloaded'], timeout: 45000 });
    } catch (navErr) {
      const navMsg = navErr instanceof Error ? navErr.message : String(navErr);
      console.warn('[screenshot] navigation warning', navMsg);
    }
    if (norm.waitMs) await new Promise(r => setTimeout(r, norm.waitMs));
    // Ensure body is present (non-fatal)
    await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});

    const screenshot = await page.screenshot({
      fullPage: norm.fullPage,
      type: norm.type,
      quality: norm.quality,
      captureBeyondViewport: false
    });

    const resp = new NextResponse(screenshot as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': `image/${norm.type === 'png' ? 'png' : norm.type}`,
        'Cache-Control': 'public, max-age=60',
        'X-Screenshot-Time': String(Date.now() - started),
      },
    });
    return resp;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[screenshot.GET] Error', message);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400" role="img" aria-label="Screenshot error"><rect width="800" height="400" fill="#18181b"/><text x="50%" y="40%" fill="#fafafa" font-size="22" font-family="system-ui, sans-serif" dominant-baseline="middle" text-anchor="middle">Preview Unavailable</text><text x="50%" y="58%" fill="#9ca3af" font-size="14" font-family="system-ui, sans-serif" dominant-baseline="middle" text-anchor="middle">${escapeHtml(message).slice(0,100)}</text></svg>`;
    // Return 200 so <img> does not show broken icon
    return new NextResponse(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' } });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeHtml(str: string) {
  return str.replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
}
