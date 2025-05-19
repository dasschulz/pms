import type {Metadata} from 'next';
import { Work_Sans, Inter } from 'next/font/google';
import './globals.css';
import {AppLayout} from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'], // Ensure 300 and 900 are requested
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'TEST_UPDATE - DIE LINKE Suite', // Geänderter Titel für Testzwecke
  description: 'Politische Werkzeugsammlung für Mitglieder von DIE LINKE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${workSans.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
