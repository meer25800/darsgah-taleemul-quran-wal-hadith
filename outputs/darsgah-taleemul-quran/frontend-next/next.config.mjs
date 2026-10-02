import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve("."),
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000" }
    ]
  },
  async headers() {
    const scriptPolicy = process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const directives = [
      "default-src 'self'",
      scriptPolicy,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://img.youtube.com https://i.ytimg.com",
      "media-src 'self' blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https: http://localhost:5000 http://127.0.0.1:5000",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ];
    if (process.env.NODE_ENV === "production") directives.push("upgrade-insecure-requests");
    const contentSecurityPolicy = directives.join("; ");
    const documentPolicy = directives
      .filter((directive) => !directive.startsWith("frame-ancestors"))
      .concat("frame-ancestors 'self'")
      .join("; ");
    return [
      {
        source: "/api/document",
        headers: [
          { key: "Content-Security-Policy", value: documentPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      },
      {
        source: "/((?!api/document).*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
