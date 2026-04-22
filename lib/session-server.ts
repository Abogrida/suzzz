import { cookies } from 'next/headers';

export default async function getSessionServer() {
    try {
        const cookieStore = await cookies();
        
        // Check admin cookie
        const adminToken = cookieStore.get('auth-token')?.value;
        if (adminToken === process.env.NEXTAUTH_SECRET) {
            // Admin user is given id: 0 to distinguish it in chat widget
            return { id: 0, role: 'admin', name: 'مدير النظام', permissions: [] };
        }

        // Check employee cookie
        const empToken = cookieStore.get('sys-user-token')?.value;
        if (empToken) {
            try {
                const decoded = Buffer.from(empToken, 'base64').toString('utf-8');
                const emp = JSON.parse(decoded);
                return {
                    id: emp.id,
                    name: emp.name,
                    role: emp.role || 'staff',
                    job_title: emp.job_title || '',
                    permissions: emp.permissions || []
                };
            } catch (e) {
                console.error("Error decoding employee token in session-server:", e);
            }
        }
    } catch (e) {
        console.error("Error accessing cookies in session-server:", e);
    }

    return null;
}
