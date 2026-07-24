import type { Metadata } from "next";
import "./globals.css";
import GoogleAuthProvider from "@/providers/GoogleOAuthProvider";
import QueryProvider from "@/providers/QueryProvider";
import Header from "./components/layout/Header";
import MenuTitle from "./components/layout/MenuTitle";

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
    <html lang="ko" className="h-full antialiased bg-semantic-100">
      <body className="min-h-full flex flex-col justify-start items-center">
        <div className="w-full max-w-container min-h-full flex flex-col">
          <QueryProvider>
            <GoogleAuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <MenuTitle iconSrc={"/images/icons/arrow.svg"}>title</MenuTitle>
              <MenuTitle type="close" iconSrc={"/images/icons/close.svg"}>
                title
              </MenuTitle>
            </GoogleAuthProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
