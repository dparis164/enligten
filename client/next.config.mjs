/** @type {import('next').NextConfig} */
const nextConfig = {

 eslint: {
        ignoreDuringBuilds: true,
    },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
