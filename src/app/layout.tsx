// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/app/components/navbar';
import Footer from '@/app/components/footer';
import { Providers } from './providers';
import GlobalCallHandler from '@/app/components/GlobalCallHandler';
import ChatBubble from '@/app/components/chat';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SkillConnect',
  description: 'Join a community of learners and mentors to share skills, knowledge, and experiences in a collaborative environment.',
  icons: {
    icon: [
        {
            url: "/logo.png",
            href: "/logo.png",
        },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body>
        <Providers>
          <GlobalCallHandler />
          <Navbar />
          {children}
          <Footer />
          <ChatBubble />
        </Providers>
      </body>
    </html>
  );
}