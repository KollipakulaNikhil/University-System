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
        // Total Instructors
        const [instructorRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM users WHERE role = 'instructor'"
        );
        const totalInstructors = instructorRows[0].count;

        // Total Students
        const [studentRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
        );
        const totalStudents = studentRows[0].count;

        // Instructors who created sections (distinct)
        const [activeInstructorRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT instructor_id) as count FROM sections"
        );
        const activeInstructors = activeInstructorRows[0].count;

        // Students enrolled in at least one course (distinct)
        const [enrolledStudentRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT student_id) as count FROM enrollments WHERE status = 'enrolled'"
        );
        const enrolledStudents = enrolledStudentRows[0].count;

        const notEnrolledStudents = totalStudents - enrolledStudents;

        // Get Enrolled Student List
        const [enrolledStudentList] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email FROM users 
             WHERE role = 'student' 
             AND id IN (SELECT DISTINCT student_id FROM enrollments WHERE status = 'enrolled')`
        );

        // Get Not Enrolled Student List
        const [notEnrolledStudentList] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email FROM users 
             WHERE role = 'student' 
             AND id NOT IN (SELECT DISTINCT student_id FROM enrollments WHERE status = 'enrolled')`
        );

        // Get Total Instructor List
        const [totalInstructorList] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email FROM users WHERE role = 'instructor'`
        );

        // Get Active Instructor List
        const [activeInstructorList] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email FROM users 
             WHERE role = 'instructor' 
             AND id IN (SELECT DISTINCT instructor_id FROM sections)`
        );

        return NextResponse.json({
            totalInstructors,
            totalStudents,
            activeInstructors,
            enrolledStudents,
            notEnrolledStudents,
            enrolledStudentList,
            notEnrolledStudentList,
            totalInstructorList,
            activeInstructorList
        });

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
