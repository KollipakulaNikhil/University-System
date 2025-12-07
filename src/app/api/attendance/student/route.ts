import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                c.code as course_code,
                c.title as course_title,
                COUNT(a.id) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as attended_classes,
                SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_classes
             FROM enrollments e
             JOIN sections s ON e.section_id = s.id
             JOIN courses c ON s.course_code = c.code
             LEFT JOIN attendance a ON e.student_id = a.student_id AND e.section_id = a.section_id
             WHERE e.student_id = ?
             GROUP BY c.code, c.title`,
            [session.user.id]
        );

        const stats = rows.map(row => {
            const total = row.total_classes;
            const attended = row.attended_classes || 0;
            const excused = row.excused_classes || 0;
            // Calculate percentage based on (attended + excused) / total, or just attended / total depending on policy.
            // Let's assume excused counts as attended for percentage purposes, or is excluded from total.
            // Simple approach: Percentage = (Attended / Total) * 100
            const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : "0.0";

            return {
                course_code: row.course_code,
                course_title: row.course_title,
                total_classes: total,
                attended_classes: attended,
                excused_classes: excused,
                percentage: percentage
            };
        });

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching student attendance stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
