import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'instructor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { student_id, reason } = await request.json();

        if (!student_id || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await pool.query<ResultSetHeader>(
            'INSERT INTO disciplinary_reports (student_id, instructor_id, reason) VALUES (?, ?, ?)',
            [student_id, session.user.id, reason]
        );

        return NextResponse.json({ message: 'Report submitted successfully' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        console.log("Fetching disciplinary reports for admin:", session.user.email, "Status:", status);

        let query = `
            SELECT 
                dr.id, dr.reason, dr.status, dr.suspension_days, dr.created_at,
                s.name as student_name, s.email as student_email, s.suspended_until,
                i.name as instructor_name
            FROM disciplinary_reports dr
            JOIN users s ON dr.student_id = s.id
            JOIN users i ON dr.instructor_id = i.id
        `;

        const params: any[] = [];

        if (status !== 'all') {
            query += ` WHERE dr.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY dr.created_at DESC`;

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
