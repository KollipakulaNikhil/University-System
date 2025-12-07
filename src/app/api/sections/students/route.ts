import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'instructor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section_id = searchParams.get('section_id');

    if (!section_id) {
        return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    try {
        // Verify the instructor owns this section
        const [sectionRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM sections WHERE id = ? AND instructor_id = ?',
            [section_id, session.user.id]
        );

        if (sectionRows.length === 0) {
            return NextResponse.json({ error: 'Section not found or access denied' }, { status: 403 });
        }

        // Fetch enrolled students
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                u.id as student_id, 
                u.name, 
                u.email, 
                u.suspended_until,
                e.grade 
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             WHERE e.section_id = ? AND e.status = 'enrolled'`,
            [section_id]
        );

        return NextResponse.json(rows);

    } catch (error: any) {
        console.error("Failed to fetch students:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
