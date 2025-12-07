import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    try {
        let query = '';
        let params: any[] = [];

        // RLS: Student can only see their own grades
        if (role === 'student') {
            query = `
        SELECT c.code, c.title, s.term, e.grade
        FROM enrollments e
        JOIN sections s ON e.section_id = s.id
        JOIN courses c ON s.course_code = c.code
        WHERE e.student_id = ?
      `;
            params = [userId];
        }
        // RLS: Instructor can only see grades for their sections
        else if (role === 'instructor') {
            if (!sectionId) {
                return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
            }

            // Verify instructor owns the section
            const [sections] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM sections WHERE id = ? AND instructor_id = ?',
                [sectionId, userId]
            );

            if (sections.length === 0) {
                return NextResponse.json({ error: 'Access denied to this section' }, { status: 403 });
            }

            query = `
        SELECT u.id as student_id, u.name, u.email, e.grade
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.section_id = ?
      `;
            params = [sectionId];
        }
        // RLS: Admin sees all (or specific section if provided)
        else if (role === 'admin') {
            if (sectionId) {
                query = `
          SELECT u.id as student_id, u.name, e.grade
          FROM enrollments e
          JOIN users u ON e.student_id = u.id
          WHERE e.section_id = ?
        `;
                params = [sectionId];
            } else {
                query = 'SELECT * FROM enrollments';
            }
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, sectionId, grade } = await request.json();
    const userId = session.user.id;

    try {
        // Verify instructor owns the section
        if (session.user.role === 'instructor') {
            const [sections] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM sections WHERE id = ? AND instructor_id = ?',
                [sectionId, userId]
            );

            if (sections.length === 0) {
                return NextResponse.json({ error: 'Access denied to this section' }, { status: 403 });
            }
        }

        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE enrollments SET grade = ? WHERE student_id = ? AND section_id = ?',
            [grade, studentId, sectionId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Grade updated' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
