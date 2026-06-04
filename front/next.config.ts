const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:${process.env.BACKEND_PORT}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
