import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import ChatWidget from '@/components/chat/ChatWidget';
import getSessionServer from '@/lib/session-server';

const cairo = Cairo({
    subsets: ['arabic', 'latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',
    variable: '--font-cairo',
});

export const metadata: Metadata = {
    title: 'نظام إدارة المخزون',
    description: 'نظام متكامل لإدارة المخزون والفواتير',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionServer();
    
    return (
        <html lang="ar" dir="rtl">
            <body className={cairo.className} style={{ fontFamily: 'Cairo, sans-serif' }}>
                {children}
                <ChatWidget user={user} />
            </body>
        </html>
    );
}
