import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mira - AI Job Tracker & Interview Prep",
  description: "Meet Mira, your application prep friend. Parse resumes, organize job applications, draft cover letters, and practice with a live AI interviewer.",
  keywords: ["job tracker", "resume parser", "interview prep", "AI interview", "career prep", "cover letter generator"],
  authors: [{ name: "Mira Team" }],
  openGraph: {
    title: "Mira - AI Job Tracker & Interview Prep",
    description: "Meet Mira, your application prep friend. Parse resumes, organize job applications, draft cover letters, and practice with a live AI interviewer.",
    url: "https://applywithmira.vercel.app/",
    siteName: "Mira",
    images: [
      {
        url: "/Mira.png",
        width: 512,
        height: 512,
        alt: "Mira Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Mira - AI Job Tracker & Interview Prep",
    description: "Meet Mira, your application prep friend. Parse resumes, organize job applications, draft cover letters, and practice with a live AI interviewer.",
    images: ["/Mira.png"],
  },
  icons: {
    icon: "/Mira.png",
    shortcut: "/Mira.png",
    apple: "/Mira.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
