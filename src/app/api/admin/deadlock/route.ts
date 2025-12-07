import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceA, resourceB, delay = 1000 } = await request.json();
    // resourceA and resourceB should be section IDs

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Lock Resource A
        await connection.query('SELECT * FROM sections WHERE id = ? FOR UPDATE', [resourceA]);
        console.log(`Locked resource ${resourceA}, waiting ${delay}ms...`);

        // Wait to allow the other transaction to lock Resource B
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try to lock Resource B
        console.log(`Trying to lock resource ${resourceB}...`);
        await connection.query('SELECT * FROM sections WHERE id = ? FOR UPDATE', [resourceB]);

        await connection.commit();
        return NextResponse.json({ message: 'Transaction completed successfully' });

    } catch (error: any) {
        await connection.rollback();
        console.error('Deadlock or error:', error.message);
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    } finally {
        connection.release();
    }
}
