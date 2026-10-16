/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/god-mode",
        destination: "/wizard-area",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
