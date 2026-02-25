import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
