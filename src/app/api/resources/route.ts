import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [rooms] = await pool.query<RowDataPacket[]>('SELECT * FROM rooms');
        const [timeslots] = await pool.query<RowDataPacket[]>('SELECT * FROM timeslots ORDER BY day, start_time');

        return NextResponse.json({ rooms, timeslots });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
