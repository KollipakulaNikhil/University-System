import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM courses');
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { code, title, credits, program_id } = await request.json();

        // Basic validation
        if (!code || !title || !credits) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO courses (code, title, credits, program_id) VALUES (?, ?, ?, ?)',
            [code, title, credits, program_id || null]
        );

        return NextResponse.json({ message: 'Course created', code }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { code, title, credits, program_id } = await request.json();

        if (!code || !title || !credits) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE courses SET title = ?, credits = ?, program_id = ? WHERE code = ?',
            [title, credits, program_id || null, code]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Course updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Missing course code' }, { status: 400 });
        }

        // Check if course has sections or enrollments (optional but good practice)
        // For now, we'll just try to delete and let FK constraints handle it or force delete if needed.
        // Assuming ON DELETE RESTRICT by default in schema, so this might fail if sections exist.
        // Let's just try to delete the course.

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM courses WHERE code = ?',
            [code]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
