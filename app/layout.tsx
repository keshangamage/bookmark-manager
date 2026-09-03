import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {AsgardeoProvider} from '@asgardeo/nextjs/server';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// AsgardeoProvider reads headers(), so nothing here can be prerendered.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bookmark Manager',
  description: 'A personal bookmark manager secured with WSO2 Asgardeo.',
};

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Org has no branding configured; skip the lookup. */}
        <AsgardeoProvider preferences={{theme: {inheritFromBranding: false}}}>
          {children}
        </AsgardeoProvider>
      </body>
    </html>
  );
}
