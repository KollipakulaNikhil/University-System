import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [users] = await pool.query<RowDataPacket[]>("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Get Users API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete user
        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error: any) {
        console.error("Delete User API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

    } catch (error: any) {
        console.error("Create User API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
