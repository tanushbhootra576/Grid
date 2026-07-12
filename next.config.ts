import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "react-markdown",
    "vfile",
    "unified",
    "unist-util-visit",
    "bail",
    "is-plain-obj",
    "trough",
  ],
  serverExternalPackages: [
    "mongoose", 
    "puppeteer-core", 
    "@sparticuz/chromium",
    "tesseract.js",
    "tesseract.js-core",
    "pdf-parse"
  ],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
    ],
  },
};

export default nextConfig;
