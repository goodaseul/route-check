import type { Metadata } from "next";
import "./globals.css";
import GoogleAuthProvider from "@/providers/GoogleOAuthProvider";
import QueryProvider from "@/providers/QueryProvider";
import Header from "@/components/layout/Header";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  //  metadataBase: new URL("https://route-check.com"), // 실제 도메인

  title: "Route-check",
  description: "여행 가기 전에, 여행의 완성도를 올려보자!",

  openGraph: {
    title: "Route-check",
    description: "여행 가기 전에, 여행의 완성도를 올려보자!",
    siteName: "Route-check",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Route-check Graph Image",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased bg-semantic-100">
      <body className="min-h-full flex flex-col justify-start items-center">
        <div className="w-full max-w-container min-h-full flex flex-col">
          <QueryProvider>
            <GoogleAuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Toaster position="bottom-center" />
            </GoogleAuthProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
