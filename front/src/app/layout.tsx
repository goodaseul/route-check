import type { Metadata } from "next";
import "./globals.css";
import GoogleAuthProvider from "@/providers/GoogleOAuthProvider";
import QueryProvider from "@/providers/QueryProvider";
import Header from "./components/layout/Header";

export const metadata: Metadata = {
  title: "Route-check",
  description: "여행 가기전에, 여행의 완성도를 올려보자!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <GoogleAuthProvider>
            <Header />
            <main className="max-w-container">{children}</main>
          </GoogleAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
