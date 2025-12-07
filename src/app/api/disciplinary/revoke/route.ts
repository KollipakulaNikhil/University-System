import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { report_id } = await request.json();

        if (!report_id) {
            return NextResponse.json({ error: 'Missing report_id' }, { status: 400 });
        }

        // Get the report to find the student_id
        const [reports] = await pool.query<RowDataPacket[]>(
            'SELECT student_id FROM disciplinary_reports WHERE id = ?',
            [report_id]
        );

        if (reports.length === 0) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const student_id = reports[0].student_id;

        // Update report status
        await pool.query(
            "UPDATE disciplinary_reports SET status = 'revoked' WHERE id = ?",
            [report_id]
        );

        // Revoke suspension (set suspended_until to NULL)
        await pool.query(
            "UPDATE users SET suspended_until = NULL WHERE id = ?",
            [student_id]
        );

        return NextResponse.json({ message: 'Suspension revoked successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
