"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Users, Save, Plus, Calendar, Edit, AlertTriangle, X, CheckCircle } from "lucide-react";

interface Section {
    id: number;
    code: string;
    title: string;
    term: string;
    section_number: number;
    enrolled: number;
    capacity: number;
    room_name: string;
    day: string;
    start_time: string;
    end_time: string;
    room_id: number;
    timeslot_id: number;
}

interface StudentGrade {
    student_id: number;
    name: string;
    email: string;
    grade: string | null;
    suspended_until?: string | null;
}

interface Course {
    code: string;
    title: string;
}

interface Room {
    id: number;
    name: string;
    capacity: number;
}

interface Timeslot {
    id: number;
    day: string;
    start_time: string;
    end_time: string;
}

interface AttendanceRecord {
    student_id: number;
    status: 'present' | 'absent' | 'excused';
}

export default function InstructorDashboard() {
    const { data: session } = useSession();
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [students, setStudents] = useState<StudentGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<{ [key: number]: boolean }>({});

    // Resource state for creating sections
    const [courses, setCourses] = useState<Course[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [reportingStudent, setReportingStudent] = useState<StudentGrade | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [newSection, setNewSection] = useState({
        course_code: "",
        term: "Fall 2024",
        room_id: "",
        timeslot_id: "",
        capacity: 30
    });

    // Attendance State
    const [isTakingAttendance, setIsTakingAttendance] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        fetchSections();
        fetchResources();
    }, []);

    const fetchSections = async () => {
        try {
            const res = await fetch("/api/timetable");
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setSections(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch sections", error);
            setSections([]); // Ensure sections is always an array
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [coursesRes, resourcesRes] = await Promise.all([
                fetch("/api/courses"),
                fetch("/api/resources")
            ]);
            const coursesData = await coursesRes.json();
            const resourcesData = await resourcesRes.json();

            setCourses(coursesData);
            setRooms(resourcesData.rooms);
            setTimeslots(resourcesData.timeslots);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        }
    };

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = isEditing ? "PUT" : "POST";
            const body: any = {
                ...newSection,
                room_id: Number(newSection.room_id),
                timeslot_id: Number(newSection.timeslot_id),
                capacity: Number(newSection.capacity)
            };

            if (isEditing) {
                body.id = editingId;
            }

            const res = await fetch("/api/sections", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsCreating(false);
                setIsEditing(false);
                setEditingId(null);
                setNewSection({
                    course_code: "",
                    term: "Fall 2024",
                    room_id: "",
                    timeslot_id: "",
                    capacity: 30
                });
                fetchSections();
            } else {
                const data = await res.json();
                alert(`Failed to ${isEditing ? "update" : "create"} section: ${data.error}`);
            }
        } catch (error) {
            console.error(`Error ${isEditing ? "updating" : "creating"} section`, error);
            alert(`Error ${isEditing ? "updating" : "creating"} section`);
        }
    };

    const handleEditSection = (section: Section) => {
        setNewSection({
            course_code: section.code,
            term: section.term,
            room_id: String(section.room_id),
            timeslot_id: String(section.timeslot_id),
            capacity: section.capacity
        });
        setEditingId(section.id);
        setIsCreating(true);
        setIsEditing(true);
    };

    const fetchStudents = async (section: Section) => {
        setSelectedSection(section);
        setStudents([]); // Clear previous students
        try {
            // Fetch real students from API
            const res = await fetch(`/api/sections/students?section_id=${section.id}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            } else {
                console.error("Failed to fetch students");
            }
        } catch (error) {
            console.error("Error fetching students", error);
        }
    };

    const handleGradeChange = async (studentId: number, newGrade: string) => {
        setSaving((prev) => ({ ...prev, [studentId]: true }));
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setStudents((prev) =>
                prev.map((s) =>
                    s.student_id === studentId ? { ...s, grade: newGrade } : s
                )
            );
        } catch (error) {
            console.error("Failed to save grade", error);
        } finally {
            setSaving((prev) => ({ ...prev, [studentId]: false }));
        }
    };

    const handleReportStudent = async () => {
        if (!reportingStudent || !reportReason) return;

        try {
            const res = await fetch("/api/disciplinary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: reportingStudent.student_id,
                    reason: reportReason
                }),
            });

            if (res.ok) {
                alert("Report submitted successfully");
                setReportingStudent(null);
                setReportReason("");
            } else {
                const data = await res.json();
                alert(`Failed to submit report: ${data.error}`);
            }
        } catch (error) {
            console.error("Error submitting report", error);
            alert("Error submitting report");
        }
    };

    const openAttendanceModal = async (section: Section) => {
        setSelectedSection(section);
        setIsTakingAttendance(true);
        setAttendanceDate(new Date().toISOString().split('T')[0]);

        // Fetch students first
        await fetchStudents(section);

        // Initialize attendance records as 'present' for all non-suspended students
        // We will fetch existing attendance if any when date changes
    };

    const fetchAttendance = async () => {
        if (!selectedSection) return;
        try {
            const res = await fetch(`/api/attendance?section_id=${selectedSection.id}&date=${attendanceDate}`);
            if (res.ok) {
                const data = await res.json();
                // Merge with students list
                // If record exists, use it. If not, default to 'present' (unless suspended)
                const records: AttendanceRecord[] = students.map(s => {
                    const isSuspended = s.suspended_until && new Date(s.suspended_until) > new Date();
                    const existing = data.find((r: any) => r.student_id === s.student_id);

                    let status: 'present' | 'absent' | 'excused' = 'present';
                    if (existing) {
                        status = existing.status;
                    } else if (isSuspended) {
                        status = 'absent';
                    }

                    return {
                        student_id: s.student_id,
                        status: status
                    };
                });
                setAttendanceRecords(records);
            }
        } catch (error) {
            console.error("Error fetching attendance", error);
        }
    };

    useEffect(() => {
        if (isTakingAttendance && selectedSection) {
            fetchAttendance();
        }
    }, [attendanceDate, isTakingAttendance, selectedSection, students]); // Re-fetch when date changes or modal opens

    const handleAttendanceChange = (studentId: number, status: 'present' | 'absent' | 'excused') => {
        setAttendanceRecords(prev =>
            prev.map(r => r.student_id === studentId ? { ...r, status } : r)
        );
    };

    const submitAttendance = async () => {
        if (!selectedSection) return;
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    section_id: selectedSection.id,
                    date: attendanceDate,
                    records: attendanceRecords
                }),
            });

            if (res.ok) {
                alert("Attendance saved successfully");
                setIsTakingAttendance(false);
            } else {
                const data = await res.json();
                alert(`Failed to save attendance: ${data.error}`);
            }
        } catch (error) {
            console.error("Error saving attendance", error);
            alert("Error saving attendance");
        }
    };

    if (loading) return <div className="p-8">Loading sections...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Instructor Dashboard
                    </h2>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sections List & Creation */}
                <div className="col-span-1 bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">My Sections</h3>
                            <button
                                onClick={() => {
                                    setIsCreating(!isCreating);
                                    setIsEditing(false);
                                    setEditingId(null);
                                    setNewSection({
                                        course_code: "",
                                        term: "Fall 2024",
                                        room_id: "",
                                        timeslot_id: "",
                                        capacity: 30
                                    });
                                }}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                {isCreating ? "Cancel" : "New"}
                            </button>
                        </div>

                        {isCreating && (
                            <form onSubmit={handleCreateSection} className="mb-6 bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Course</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                            value={newSection.course_code}
                                            onChange={(e) => setNewSection({ ...newSection, course_code: e.target.value })}
                                        >
                                            <option value="">Select Course</option>
                                            {courses.map(c => (
                                                <option key={c.code} value={c.code}>{c.code} - {c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Term</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                            value={newSection.term}
                                            onChange={(e) => setNewSection({ ...newSection, term: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Timeslot</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                            value={newSection.timeslot_id}
                                            onChange={(e) => setNewSection({ ...newSection, timeslot_id: e.target.value })}
                                        >
                                            <option value="">Select Time</option>
                                            {timeslots.map(t => (
                                                <option key={t.id} value={t.id}>{t.day} {t.start_time}-{t.end_time}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Room</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                            value={newSection.room_id}
                                            onChange={(e) => setNewSection({ ...newSection, room_id: e.target.value })}
                                        >
                                            <option value="">Select Room</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Capacity</label>
                                        <input
                                            type="number"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                            value={newSection.capacity}
                                            onChange={(e) => setNewSection({ ...newSection, capacity: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                                        >
                                            {isEditing ? "Update" : "Create"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="mt-4 flow-root">
                            <ul role="list" className="-my-5 divide-y divide-gray-200">
                                {sections.map((section, index) => (
                                    <li key={index} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {section.code} - {section.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Sec {section.section_number} • {section.term}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {section.day} {section.start_time}-{section.end_time} ({section.room_name})
                                                </p>
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditSection(section)}
                                                        className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => fetchStudents(section)}
                                                        className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => openAttendanceModal(section)}
                                                    className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Attendance
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Grading Interface */}
                <div className="col-span-1 lg:col-span-2 bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        {selectedSection ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                                        Grading: {selectedSection.code} (Sec {selectedSection.section_number})
                                    </h3>
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                        <Users className="w-3 h-3 mr-1" />
                                        {selectedSection.enrolled} / {selectedSection.capacity} Students
                                    </span>
                                </div>

                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                    Student
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    Grade
                                                </th>
                                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                    <span className="sr-only">Status</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {students.map((student) => (
                                                <tr key={student.student_id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                        {student.name}
                                                        {student.suspended_until && new Date(student.suspended_until) > new Date() && (
                                                            <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                                Suspended
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{student.email}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <select
                                                            value={student.grade || ""}
                                                            onChange={(e) => handleGradeChange(student.student_id, e.target.value)}
                                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                        >
                                                            <option value="">-</option>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="D">D</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {saving[student.student_id] && <span className="text-gray-400 mr-2">Saving...</span>}
                                                        <button
                                                            onClick={() => setReportingStudent(student)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Report Indiscipline"
                                                        >
                                                            <AlertTriangle className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No section selected</h3>
                                <p className="mt-1 text-sm text-gray-500">Select a section from the list to view students and enter grades.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {reportingStudent && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Report Student: {reportingStudent.name}</h3>
                            <button onClick={() => setReportingStudent(null)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Report</label>
                            <textarea
                                rows={4}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                placeholder="Describe the indisciplinary action..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleReportStudent}
                                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isTakingAttendance && selectedSection && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Attendance: {selectedSection.code}
                            </h3>
                            <button onClick={() => setIsTakingAttendance(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {students.map((student) => {
                                        const isSuspended = student.suspended_until && new Date(student.suspended_until) > new Date();
                                        const record = attendanceRecords.find(r => r.student_id === student.student_id);
                                        const status = record ? record.status : 'present';

                                        return (
                                            <tr key={student.student_id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                    <div>
                                                        {student.name}
                                                        {isSuspended && (
                                                            <div className="text-xs text-red-600 font-medium mt-1">
                                                                Blocked (Suspended)
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {isSuspended ? (
                                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                            Absent (Blocked)
                                                        </span>
                                                    ) : (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleAttendanceChange(student.student_id, 'present')}
                                                                className={`px-3 py-1 rounded-md text-xs font-medium ${status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => handleAttendanceChange(student.student_id, 'absent')}
                                                                className={`px-3 py-1 rounded-md text-xs font-medium ${status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                Absent
                                                            </button>
                                                            <button
                                                                onClick={() => handleAttendanceChange(student.student_id, 'excused')}
                                                                className={`px-3 py-1 rounded-md text-xs font-medium ${status === 'excused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}
                                                            >
                                                                Excused
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-end pt-4 border-t border-gray-200">
                            <button
                                onClick={submitAttendance}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Save Attendance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
