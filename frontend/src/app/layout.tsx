import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Snake & Ladder Adventure',
  description: 'A fun, cartoon-style Snake & Ladder adventure game. Play with up to 20 friends!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="jungle-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
