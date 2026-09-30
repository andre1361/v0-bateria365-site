/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // As imagens de pré-visualização leem a fonte e o logo do disco; garante que vão junto no deploy.
  outputFileTracingIncludes: {
    "/codigo-radio/opengraph-image": ["./lib/og/*.ttf", "./public/images/logo-bateria365-*.png"],
    "/l/[slug]/opengraph-image": ["./lib/og/*.ttf", "./public/images/logo-bateria365-*.png"],
  },
}

export default nextConfig
