import {AsgardeoProvider} from '@asgardeo/nextjs/server';
import type {Metadata} from 'next';
import {Bricolage_Grotesque, Geist, Geist_Mono} from 'next/font/google';
import SiteHeader from './_components/SiteHeader';
import ThemeProvider from './_components/ThemeProvider';
import './globals.css';

// Display face: tight, slightly odd grotesque. Used only for headings.
const bricolage = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
});

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
  description: 'A personal bookmark manager with secure, per-user sign-in.',
};

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class before hydration.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions inject attributes on <body> before React hydrates. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Skip branding + organization lookups: unused here, and they cost
              two extra API round-trips on every render. */}
          <AsgardeoProvider
            preferences={{
              theme: {inheritFromBranding: false},
              user: {fetchOrganizations: false},
            }}
          >
            <SiteHeader />
            {children}
          </AsgardeoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
