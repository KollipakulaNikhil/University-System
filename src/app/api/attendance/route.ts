import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "instructor") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { section_id, date, records } = await req.json();

        if (!section_id || !date || !records || !Array.isArray(records)) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        // Verify instructor owns the section
        const [sections] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM sections WHERE id = ? AND instructor_id = ?",
            [section_id, session.user.id]
        );

        if (sections.length === 0) {
            return NextResponse.json({ error: "Section not found or unauthorized" }, { status: 404 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const record of records) {
                await connection.query(
                    `INSERT INTO attendance (student_id, section_id, date, status)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
                    [record.student_id, section_id, date, record.status]
                );
            }

            await connection.commit();
            return NextResponse.json({ message: "Attendance marked successfully" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error marking attendance:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "instructor") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const section_id = searchParams.get("section_id");
    const date = searchParams.get("date");

    if (!section_id || !date) {
        return NextResponse.json({ error: "Missing section_id or date" }, { status: 400 });
    }

    try {
        // Verify instructor owns the section
        const [sections] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM sections WHERE id = ? AND instructor_id = ?",
            [section_id, session.user.id]
        );

        if (sections.length === 0) {
            return NextResponse.json({ error: "Section not found or unauthorized" }, { status: 404 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT a.student_id, a.status, u.name as student_name, u.email as student_email, u.suspended_until
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             LEFT JOIN attendance a ON e.student_id = a.student_id AND a.section_id = ? AND a.date = ?
             WHERE e.section_id = ?`,
            [section_id, date, section_id]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
