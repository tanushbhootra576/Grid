import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['react-markdown', 'vfile', 'unified', 'unist-util-visit', 'bail', 'is-plain-obj', 'trough'],
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'puppeteer-core', '@sparticuz/chromium'],
  },
};

export default nextConfig;
