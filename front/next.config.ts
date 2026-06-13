const nextConfig = {
  async rewrites() {
    const backendHost = process.env.BACKEND_HOST || "localhost";
    const backendPort = process.env.BACKEND_PORT || "8000";

    return [
      {
        source: "/api/:path*",
        destination: `http://${backendHost}:${backendPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
