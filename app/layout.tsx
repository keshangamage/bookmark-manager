import {AsgardeoProvider} from '@asgardeo/nextjs/server';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import SiteHeader from './_components/SiteHeader';
import ThemeProvider from './_components/ThemeProvider';
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
    // suppressHydrationWarning: next-themes sets the theme class before hydration.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions inject attributes on <body> before React hydrates. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Org has no branding configured; skip the lookup. */}
          <AsgardeoProvider preferences={{theme: {inheritFromBranding: false}}}>
            <SiteHeader />
            {children}
          </AsgardeoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
