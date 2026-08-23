/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // keep pdf-parse external so its bundled pdf.js runs natively under Node
    serverComponentsExternalPackages: ["pdf-parse", "@react-pdf/renderer"],
  },
};

export default nextConfig;
