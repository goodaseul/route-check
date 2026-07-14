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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "tong.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
