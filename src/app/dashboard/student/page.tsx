"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, ChevronUp, ChevronDown, AlertTriangle, CheckCircle } from "lucide-react";

interface AttendanceStat {
    course_code: string;
    course_title: string;
    total_classes: number;
    attended_classes: number;
    excused_classes: number;
    percentage: string;
}

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState("timetable");
    const [enrolledSections, setEnrolledSections] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
    const [loadingSections, setLoadingSections] = useState(false);
    const [courseSections, setCourseSections] = useState<any[]>([]);
    const [registering, setRegistering] = useState<string | null>(null);
    const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStat[]>([]);

    useEffect(() => {
        checkStatus();
        fetchEnrolledSections();
        fetchCourses();
        fetchAttendanceStats();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch("/api/student/status");
            if (res.ok) {
                const data = await res.json();
                setSuspendedUntil(data.suspended_until);
            }
        } catch (error) {
            console.error("Failed to check status", error);
        } finally {
            setLoadingStatus(false);
        }
    };

    const fetchEnrolledSections = async () => {
        try {
            const res = await fetch("/api/timetable");
            if (res.ok) {
                const data = await res.json();
                setEnrolledSections(data);
            }
        } catch (error) {
            console.error("Failed to fetch enrolled sections", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    const fetchAttendanceStats = async () => {
        try {
            const res = await fetch("/api/attendance/student");
            if (res.ok) {
                const data = await res.json();
                setAttendanceStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch attendance stats", error);
        }
    };

    const handleExpandCourse = async (courseCode: string) => {
        if (expandedCourse === courseCode) {
            setExpandedCourse(null);
            setCourseSections([]);
            return;
        }

        setExpandedCourse(courseCode);
        setLoadingSections(true);
        try {
            const res = await fetch(`/api/sections?course_code=${courseCode}`);
            if (res.ok) {
                const data = await res.json();
                setCourseSections(data);
            }
        } catch (error) {
            console.error("Failed to fetch sections", error);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleEnroll = async (sectionId: string) => {
        setRegistering(sectionId);
        try {
            const res = await fetch("/api/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId, simulateDeadlock: false }),
            });

            if (res.ok) {
                // Refresh enrolled sections and course sections (to update seat count)
                await fetchEnrolledSections();
                if (expandedCourse) {
                    const sectionsRes = await fetch(`/api/sections?course_code=${expandedCourse}`);
                    if (sectionsRes.ok) {
                        const data = await sectionsRes.json();
                        setCourseSections(data);
                    }
                }
                alert("Enrolled successfully!");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to enroll");
            }
        } catch (error) {
            console.error("Enrollment error", error);
            alert("An error occurred during enrollment");
        } finally {
            setRegistering(null);
        }
    };

    if (loadingStatus) {
        return <div className="p-8">Loading...</div>;
    }

    if (suspendedUntil) {
        const suspensionDate = new Date(suspendedUntil);
        const now = new Date();

        if (suspensionDate > now) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Account Suspended</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>
                                            Your account has been suspended due to a disciplinary report.
                                        </p>
                                        <p className="mt-2 font-semibold">
                                            Suspension ends on: {suspensionDate.toLocaleString()}
                                        </p>
                                        <p className="mt-1 text-xs">
                                            Access will be automatically restored after this date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Student Dashboard</h1>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("timetable")}
                        className={`${activeTab === "timetable"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        My Timetable
                    </button>
                    <button
                        onClick={() => setActiveTab("registration")}
                        className={`${activeTab === "registration"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Course Registration
                    </button>
                    <button
                        onClick={() => setActiveTab("attendance")}
                        className={`${activeTab === "attendance"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Attendance
                    </button>
                </nav>
            </div>

            {
                activeTab === "timetable" && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <ul role="list" className="divide-y divide-gray-200">
                            {enrolledSections.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">
                                    You are not enrolled in any courses yet.
                                </li>
                            ) : (
                                enrolledSections.map((section) => (
                                    <li key={section.section_id || section.code + section.section_number} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{section.code} - {section.title}</p>
                                                <p className="flex items-center text-sm text-gray-500 mt-1">
                                                    <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {section.day} {section.start_time} - {section.end_time}
                                                </p>
                                                <p className="flex items-center text-sm text-gray-500 mt-1">
                                                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {section.room_name}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm text-gray-900">Sec {section.section_number}</p>
                                                <p className="text-sm text-gray-500">{section.instructor_name}</p>
                                                <p className="text-xs text-gray-400 mt-1">{section.credits} Credits</p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )
            }

            {
                activeTab === "registration" && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Available Courses</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Select a course to view available sections.</p>
                        </div>
                        <ul role="list" className="divide-y divide-gray-200">
                            {courses.map((course) => (
                                <li key={course.code} className="bg-white">
                                    <div
                                        className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                        onClick={() => handleExpandCourse(course.code)}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-indigo-600 truncate">{course.code} - {course.title}</p>
                                            <p className="text-sm text-gray-500">{course.credits} Credits</p>
                                        </div>
                                        {expandedCourse === course.code ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    {expandedCourse === course.code && (
                                        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-100">
                                            {loadingSections ? (
                                                <p className="text-sm text-gray-500">Loading sections...</p>
                                            ) : courseSections.length === 0 ? (
                                                <p className="text-sm text-gray-500">No sections available for this course.</p>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {courseSections.map((section: any) => (
                                                        <li key={section.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Section {section.section_number}</p>
                                                                <p className="text-xs text-gray-500">{section.term} • {section.instructor_name}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {section.day} {section.start_time}-{section.end_time} ({section.room_name})
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${section.enrolled >= section.capacity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {section.enrolled} / {section.capacity}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEnroll(section.id);
                                                                    }}
                                                                    disabled={section.enrolled >= section.capacity || registering === section.id}
                                                                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {registering === section.id ? "Enrolling..." : "Enroll"}
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {
                activeTab === "attendance" && (
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance Record</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">View your attendance statistics for enrolled courses.</p>
                        </div>
                        <ul role="list" className="divide-y divide-gray-200">
                            {attendanceStats.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">
                                    No attendance records found.
                                </li>
                            ) : (
                                attendanceStats.map((stat) => (
                                    <li key={stat.course_code} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{stat.course_code} - {stat.course_title}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Attended: {stat.attended_classes} / {stat.total_classes} classes
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                                        <div
                                                            className={`h-2.5 rounded-full ${Number(stat.percentage) >= 75 ? 'bg-green-600' : Number(stat.percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                                            style={{ width: `${Math.min(Number(stat.percentage), 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{stat.percentage}%</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {stat.excused_classes > 0 ? `(${stat.excused_classes} excused)` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )
            }
        </div>
    )
}
