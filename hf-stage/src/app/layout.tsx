import type { Metadata, Viewport } from "next";
import { Caveat, Golos_Text } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "ОбедКласс — заказ еды в школьной столовой",
  description:
    "Приложение для онлайн-заказов еды в школьных столовых: староста отмечает учеников на завтрак и обед и отправляет заказ в столовую одним нажатием.",
  keywords: ["школьная столовая", "школьное питание", "заказ еды", "завтрак", "обед"],
  authors: [{ name: "Bobr677" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%2324429b%22/><text y=%22.74em%22 x=%2250%22 font-size=%2262%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22 font-weight=%22bold%22>О</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#24429b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${golos.variable} ${caveat.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
