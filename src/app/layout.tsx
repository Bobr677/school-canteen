import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ОбедКласс — заказ еды в школьной столовой",
  description:
    "Приложение для онлайн-заказов еды в школьных столовых: староста отмечает учеников на завтрак и обед и отправляет заказ в столовую одним нажатием.",
  keywords: ["школьная столовая", "школьное питание", "заказ еды", "завтрак", "обед"],
  authors: [{ name: "Bobr677" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%23e8722a%22/><text y=%22.72em%22 x=%2250%22 font-size=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22 font-weight=%22bold%22>О</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8722a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${nunito.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
