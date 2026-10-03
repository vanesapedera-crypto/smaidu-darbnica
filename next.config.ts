import type { NextConfig } from "next";

// Supabase Storage attēli (augšupielādēti administrēšanas panelī)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2400],
    // Optimizētie attēli tiek kešoti 30 dienas
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },

  // Vecās adreses → jaunā struktūra (301), lai nezaudētu saites un Google pozīcijas
  async redirects() {
    return [
      { source: "/programmas", destination: "/izklaides-programmas", permanent: true },
      { source: "/programmas/:slug", destination: "/izklaides-programmas/:slug", permanent: true },
      { source: "/pieteikt", destination: "/izklaides-programmas/pieteikt", permanent: true },
      // Webnode lapas adreses
      { source: "/rezervet/uznemumiem-un-pasvaldibam", destination: "/uznemumiem", permanent: true },
      { source: "/uznemumiem-un-pasvaldibam", destination: "/uznemumiem", permanent: true },
      { source: "/izklaides-programmas/uznemumiem-un-pasvaldibam", destination: "/uznemumiem", permanent: true },
      { source: "/smaidu-darbnicas-telpas", destination: "/telpu-noma", permanent: true },
      { source: "/rezervacijas", destination: "/izklaides-programmas/pieteikt", permanent: true },
      // Saite no agrāk sūtītajiem apstiprinājuma e-pastiem
      { source: "/rezervacijas-noteikumi", destination: "/telpu-noma#noteikumi", permanent: true },
      { source: "/musu-komanda", destination: "/par-mums", permanent: true },
      { source: "/par-mums-1", destination: "/kontakti", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Optimizētie attēli publiskajā mapē mainās reti — 30 dienu kešs pārlūkā
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
