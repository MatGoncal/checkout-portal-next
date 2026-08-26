import type { Metadata } from 'next';
import Link from 'next/link';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcmePay Checkout Portal',
  description: 'PIX checkout portal for the AcmePay portfolio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <header className="site-header">
              <div className="brand">
                <span className="brand-mark">A</span>
                <div>
                  <strong>AcmePay</strong>
                  <span className="muted">Checkout</span>
                </div>
              </div>
              <nav className="nav">
                <Link href="/">Payments</Link>
                <Link href="/checkout">Checkout</Link>
                <Link href="/splits">Splits</Link>
                <Link href="/simulator">Simulator</Link>
              </nav>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
