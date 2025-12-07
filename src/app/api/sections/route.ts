import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const course_code = searchParams.get('course_code');

    try {
        let query = `
            SELECT 
                s.id, s.course_code, s.term, s.section_number, 
                s.enrolled, s.capacity,
                s.room_id, s.timeslot_id,
                t.day, t.start_time, t.end_time,
                r.name as room_name,
                u.name as instructor_name
            FROM sections s
            JOIN timeslots t ON s.timeslot_id = t.id
            JOIN rooms r ON s.room_id = r.id
            JOIN users u ON s.instructor_id = u.id
        `;
        const params: any[] = [];

        if (course_code) {
            query += ' WHERE s.course_code = ?';
            params.push(course_code);
        }

        query += ' ORDER BY s.term, s.section_number';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'instructor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { course_code, term, room_id, timeslot_id, capacity } = await request.json();

        // Basic validation
        if (!course_code || !term || !room_id || !timeslot_id || !capacity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for room conflict
        const [roomConflicts] = await pool.query<any[]>(
            'SELECT id FROM sections WHERE room_id = ? AND timeslot_id = ?',
            [room_id, timeslot_id]
        );

        if (roomConflicts.length > 0) {
            return NextResponse.json({ error: 'Room is already booked for this timeslot' }, { status: 409 });
        }

        // Check for instructor conflict
        const [instructorConflicts] = await pool.query<any[]>(
            'SELECT id FROM sections WHERE instructor_id = ? AND timeslot_id = ?',
            [session.user.id, timeslot_id]
        );

        if (instructorConflicts.length > 0) {
            return NextResponse.json({ error: 'You are already teaching at this time' }, { status: 409 });
        }

        // Get next section number for this course and term
        const [rows] = await pool.query<any[]>(
            'SELECT MAX(section_number) as max_sec FROM sections WHERE course_code = ? AND term = ?',
            [course_code, term]
        );
        const nextSectionNum = (rows[0].max_sec || 0) + 1;

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO sections (course_code, term, section_number, instructor_id, room_id, timeslot_id, capacity, enrolled) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
            [course_code, term, nextSectionNum, session.user.id, room_id, timeslot_id, capacity]
        );

        return NextResponse.json({ message: 'Section created', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'instructor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, room_id, timeslot_id, capacity } = await request.json();

        if (!id || !room_id || !timeslot_id || !capacity) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for room conflict (excluding current section)
        const [roomConflicts] = await pool.query<any[]>(
            'SELECT id FROM sections WHERE room_id = ? AND timeslot_id = ? AND id != ?',
            [room_id, timeslot_id, id]
        );

        if (roomConflicts.length > 0) {
            return NextResponse.json({ error: 'Room is already booked for this timeslot' }, { status: 409 });
        }

        // Check for instructor conflict (excluding current section)
        const [instructorConflicts] = await pool.query<any[]>(
            'SELECT id FROM sections WHERE instructor_id = ? AND timeslot_id = ? AND id != ?',
            [session.user.id, timeslot_id, id]
        );

        if (instructorConflicts.length > 0) {
            return NextResponse.json({ error: 'You are already teaching at this time' }, { status: 409 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE sections SET room_id = ?, timeslot_id = ?, capacity = ? WHERE id = ? AND instructor_id = ?',
            [room_id, timeslot_id, capacity, id, session.user.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Section not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Section updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
