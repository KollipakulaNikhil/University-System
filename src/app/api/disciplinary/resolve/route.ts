import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { report_id, suspension_days } = await request.json();

        if (!report_id || suspension_days === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get student_id from report
        const [reportRows] = await pool.query<any[]>(
            'SELECT student_id FROM disciplinary_reports WHERE id = ?',
            [report_id]
        );

        if (reportRows.length === 0) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const student_id = reportRows[0].student_id;
        const days = Number(suspension_days);

        // Calculate suspension end date
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + days);

        // Update user suspension
        await pool.query(
            'UPDATE users SET suspended_until = ? WHERE id = ?',
            [suspendedUntil, student_id]
        );

        // Update report status
        await pool.query(
            'UPDATE disciplinary_reports SET status = "resolved", suspension_days = ? WHERE id = ?',
            [days, report_id]
        );

        return NextResponse.json({ message: 'Student suspended successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
