import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O driver Postgres é carregado por import dinâmico. Externalizá-lo garante
  // que a Vercel o inclua no runtime da função em vez de tentar empacotá-lo.
  serverExternalPackages: ["@vercel/postgres", "sharp"],
};

export default nextConfig;
