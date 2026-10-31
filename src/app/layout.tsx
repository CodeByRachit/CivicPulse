import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivicPulse — Public Infrastructure & Grievance Tracker',
  description:
    'Modern civic infrastructure platform with automated AI severity assessment, duplicate report grouping, and transparent municipal accountability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
