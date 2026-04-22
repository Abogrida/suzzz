import { NextRequest } from 'next/server';

export function getSession(req: NextRequest) {
    try {
        // Check admin cookie
        const adminToken = req.cookies.get('auth-token')?.value;
        if (adminToken === process.env.NEXTAUTH_SECRET) {
            // Admin user is given id: 0 to distinguish it in chat widget
            return { id: 0, role: 'admin', name: 'مدير النظام', permissions: [], is_admin: true };
        }

        // Check employee cookie
        const empToken = req.cookies.get('sys-user-token')?.value;
        if (empToken) {
            try {
                const decoded = Buffer.from(empToken, 'base64').toString('utf-8');
                const emp = JSON.parse(decoded);
                return {
                    id: emp.id,
                    name: emp.name,
                    role: emp.role || 'staff',
                    job_title: emp.job_title || '',
                    permissions: emp.permissions || [],
                    is_admin: false
                };
            } catch (e) {
                console.error("Error decoding employee token in session utility:", e);
            }
        }
    } catch (e) {
        console.error("Error accessing cookies in session utility:", e);
    }

    return null;
}
