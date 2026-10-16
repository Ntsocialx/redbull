import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    { protocol: "https", hostname: "img.redbull.com", pathname: "/images/c_limit,w_4000/e_trim:0:transparent/c_limit,w_200/q_auto,f_auto/redbullcom/2026/3/19/v1jtfllxhmgpliwnhxhl/red-bull-energy-drink" },
  ] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
