import type { Metadata } from 'next';
import { Navbar } from '@/components/common/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuildTrack - Construction Project & Contractor Workflow',
  description: 'Plan construction projects, assign contractor tasks, track deadlines, review progress, and manage material requests with BuildTrack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Navbar>{children}</Navbar>
      </body>
    </html>
  );
}
