import type {Metadata} from 'next';
import { Work_Sans, Inter } from 'next/font/google';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { Providers } from '@/components/providers';

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
  title: 'Linksfraktion Studio',
  description: 'Politische Werkzeugsammlung für Mitglieder von DIE LINKE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${workSans.variable} ${inter.variable} antialiased bg-background text-foreground selection:bg-selection selection:text-selection-foreground`}>
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
