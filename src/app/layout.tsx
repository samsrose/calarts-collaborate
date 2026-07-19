import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CalArts Collaborate",
    template: "%s · CalArts Collaborate",
  },
  description:
    "Cross-school Q&A for CalArts artists — ask, share files, and collaborate across disciplines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.93_0.03_85)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.92_0.04_200)_0%,_transparent_45%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,oklch(0.7_0.02_80/0.08)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.7_0.02_80/0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
