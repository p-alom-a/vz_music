import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'vzMusic - Albumcoverscope',
  description: 'Search for album covers using images or text descriptions powered by CLIP and FAISS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
