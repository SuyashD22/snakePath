import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Snake & Ladder: DSA Edition',
  description: 'A Data Structures & Algorithms competition game. Race to square 100 by answering DSA questions!',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="tech-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
