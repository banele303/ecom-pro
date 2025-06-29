/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kinde/js-utils'],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'expo-secure-store': false,
      // You might add other problematic modules here if they arise
      // fs: false,
      // path: false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
    ],
  },
};

module.exports = nextConfig;