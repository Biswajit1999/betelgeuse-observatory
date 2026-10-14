import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://biswajit1999.github.io/betelgeuse-observatory/';
const description =
  'Explore measured Betelgeuse observations, historical photometry, ALMA imaging, light-travel causality, quantitative fits and competing red-supergiant evolutionary scenarios.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Betelgeuse Observatory | A causal view of a red supergiant',
  description,
  alternates: { canonical: siteUrl },
  authors: [{ name: 'Biswajit Jana', url: 'https://github.com/Biswajit1999' }],
  keywords: ['Betelgeuse', 'red supergiant', 'stellar evolution', 'ALMA observations', 'historical photometry', 'great dimming', 'astronomy data analysis'],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: { type: 'website', url: siteUrl, title: 'Betelgeuse Observatory', description, siteName: 'Betelgeuse Observatory', images: [{ url: 'observations/alma-band8-2023.png', alt: 'ALMA observation used in the Betelgeuse Observatory analysis' }] },
  twitter: { card: 'summary_large_image', title: 'Betelgeuse Observatory', description, images: ['observations/alma-band8-2023.png'] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="sitemap" type="application/xml" href={`${siteUrl}sitemap.xml`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${siteUrl}#application`,
          name: 'Betelgeuse Observatory', url: siteUrl, description,
          applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true,
          author: { '@type': 'Person', name: 'Biswajit Jana', url: 'https://github.com/Biswajit1999' },
          codeRepository: 'https://github.com/Biswajit1999/betelgeuse-observatory',
          keywords: ['Betelgeuse', 'red supergiant', 'stellar evolution', 'ALMA', 'photometry'],
        }).replaceAll('<', '\\u003c') }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('betelgeuse-theme')||'light';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=p;document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
