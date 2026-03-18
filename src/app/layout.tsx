import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Waka Waka Predictor | World Cup 2026",
  description: "Predict match scores and win the ultimate World Cup contest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <Navbar />
        <main className="pt-32 pb-10 px-6 max-w-7xl mx-auto min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
