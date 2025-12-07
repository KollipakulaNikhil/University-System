"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Activity, ArrowLeft, Database, Layers, Plus, Search, Server, Trash2, X, Edit, AlertTriangle, CheckCircle, Users } from "lucide-react";

interface Course {
    code: string;
    title: string;
    credits: number;
    program_id?: number;
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [newCourse, setNewCourse] = useState({ code: "", title: "", credits: 3, program_id: "" });
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [simulationStatus, setSimulationStatus] = useState("");
    const [optimizationResult, setOptimizationResult] = useState<any>(null);
    const [query, setQuery] = useState("SELECT * FROM enrollments WHERE grade = 'A'");
    const [selectedList, setSelectedList] = useState<{ title: string; data: any[] } | null>(null);
    const [disciplinaryReports, setDisciplinaryReports] = useState<any[]>([]);
    const [resolvingReport, setResolvingReport] = useState<any>(null);
    const [suspensionDays, setSuspensionDays] = useState(7);

    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });

    useEffect(() => {
        if (activeTab === "courses") {
            fetchCourses();
        }
        if (activeTab === "disciplinary") {
            fetchDisciplinaryReports();
        }
        if (activeTab === "overview") {
            fetchStats();
        }
        if (activeTab === "users") {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
            const res = await fetch("/api/courses");
            const data = await res.json();
            setCourses(data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchDisciplinaryReports = async () => {
        try {
            const res = await fetch("/api/disciplinary?status=all");
            const data = await res.json();
            console.log("Fetched disciplinary reports:", data);
            setDisciplinaryReports(data);
        } catch (error) {
            console.error("Failed to fetch disciplinary reports", error);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setNewUser({ name: "", email: "", password: "", role: "student" });
                setIsCreatingUser(false);
                fetchUsers();
                alert("User created successfully");
            } else {
                const data = await res.json();
                alert(`Failed to create user: ${data.error}`);
            }
        } catch (error) {
            console.error("Error creating user", error);
            alert("Error creating user");
        }
    };

    const handleResolveReport = async () => {
        if (!resolvingReport) return;

        try {
            const res = await fetch("/api/disciplinary/resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_id: resolvingReport.id,
                    suspension_days: suspensionDays
                }),
            });

            if (res.ok) {
                alert("Student suspended and report resolved");
                setResolvingReport(null);
                fetchDisciplinaryReports();
            } else {
                const data = await res.json();
                alert(`Failed to resolve report: ${data.error}`);
            }
        } catch (error) {
            console.error("Error resolving report", error);
            alert("Error resolving report");
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch("/api/courses", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newCourse,
                    credits: Number(newCourse.credits),
                    program_id: newCourse.program_id ? Number(newCourse.program_id) : null
                }),
            });

            if (res.ok) {
                setNewCourse({ code: "", title: "", credits: 3, program_id: "" });
                setIsCreating(false);
                setIsEditing(false);
                fetchCourses();
            } else {
                alert(`Failed to ${isEditing ? "update" : "create"} course`);
            }
        } catch (error) {
            console.error(`Error ${isEditing ? "updating" : "creating"} course`, error);
        }
    };

    const handleEditCourse = (course: Course) => {
        setNewCourse({
            code: course.code,
            title: course.title,
            credits: course.credits,
            program_id: course.program_id ? String(course.program_id) : ""
        });
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleDeleteCourse = async (code: string) => {
        if (!confirm(`Are you sure you want to delete course ${code}?`)) return;

        try {
            const res = await fetch("/api/courses", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (res.ok) {
                fetchCourses();
            } else {
                alert("Failed to delete course");
            }
        } catch (error) {
            console.error("Error deleting course", error);
        }
    };

    const handleDeadlockSimulation = async () => {
        setSimulationStatus("Starting simulation...");

        // Fire two concurrent requests to trigger deadlock
        const p1 = fetch("/api/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId: 1, simulateDeadlock: true }),
        });

        const p2 = fetch("/api/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId: 1, simulateDeadlock: true }),
        });

        try {
            const [res1, res2] = await Promise.all([p1, p2]);
            const data1 = await res1.json();
            const data2 = await res2.json();

            setSimulationStatus(
                `Simulation Complete:\nRequest 1: ${res1.status} - ${JSON.stringify(data1)}\nRequest 2: ${res2.status} - ${JSON.stringify(data2)}`
            );
        } catch (error) {
            setSimulationStatus("Simulation failed: " + error);
        }
    };

    const handleOptimize = async () => {
        try {
            const res = await fetch("/api/admin/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            setOptimizationResult(data);
        } catch (error) {
            console.error("Optimization failed", error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId }),
            });

            if (res.ok) {
                // Refresh stats and close modal
                fetchStats();
                if (activeTab === "users") fetchUsers();
                setSelectedList(null);
                alert("User deleted successfully");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user", error);
            alert("An error occurred while deleting the user");
        }
    };

    const handleRevokeSuspension = async (reportId: number) => {
        if (!confirm("Are you sure you want to revoke this suspension? The student will regain access immediately.")) return;

        try {
            const res = await fetch("/api/disciplinary/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report_id: reportId }),
            });

            if (res.ok) {
                alert("Suspension revoked successfully");
                fetchDisciplinaryReports();
            } else {
                const data = await res.json();
                alert(`Failed to revoke suspension: ${data.error}`);
            }
        } catch (error) {
            console.error("Error revoking suspension", error);
            alert("Error revoking suspension");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Admin Dashboard
                    </h2>
                </div>
            </div>

            <div className="mt-8">
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select
                        id="tabs"
                        name="tabs"
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                    >
                        <option value="overview">Overview</option>
                        <option value="courses">Courses</option>
                        <option value="users">Users</option>
                        <option value="disciplinary">Disciplinary</option>
                        <option value="deadlock">Deadlock Simulation</option>
                        <option value="optimization">Query Optimization</option>
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`${activeTab === "overview"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("courses")}
                                className={`${activeTab === "courses"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <Layers className="w-4 h-4 mr-2" />
                                Courses
                            </button>
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`${activeTab === "users"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab("disciplinary")}
                                className={`${activeTab === "disciplinary"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Disciplinary
                            </button>
                            <button
                                onClick={() => setActiveTab("deadlock")}
                                className={`${activeTab === "deadlock"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Deadlock Simulation
                            </button>
                            <button
                                onClick={() => setActiveTab("optimization")}
                                className={`${activeTab === "optimization"
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                            >
                                <Database className="w-4 h-4 mr-2" />
                                Query Optimization
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {activeTab === "overview" && stats && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Instructors</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalInstructors}</dd>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setSelectedList({ title: "Total Instructors", data: stats.totalInstructorList })}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        View List
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Active Instructors</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeInstructors}</dd>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setSelectedList({ title: "Active Instructors", data: stats.activeInstructorList })}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        View List
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalStudents}</dd>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Students</dt>
                                <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.enrolledStudents}</dd>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setSelectedList({ title: "Enrolled Students", data: stats.enrolledStudentList })}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        View List
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Not Enrolled Students</dt>
                                <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.notEnrolledStudents}</dd>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setSelectedList({ title: "Not Enrolled Students", data: stats.notEnrolledStudentList })}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        View List
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Quick Actions</dt>
                                <div className="mt-2">
                                    <button
                                        onClick={() => setActiveTab("courses")}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                                    >
                                        Manage Courses
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("users")}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                                    >
                                        Manage Users
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("disciplinary")}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Disciplinary Reports
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "courses" && (
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className="mr-4 text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Course Management</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(!isCreating);
                                    setIsEditing(false);
                                    setNewCourse({ code: "", title: "", credits: 3, program_id: "" });
                                }}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                {isCreating ? "Cancel" : "New Course"}
                            </button>
                        </div>

                        {isCreating && (
                            <form onSubmit={handleCreateCourse} className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="code" className="block text-sm font-medium leading-6 text-gray-900">Code</label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="code"
                                                id="code"
                                                required
                                                disabled={isEditing}
                                                value={newCourse.code}
                                                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${isEditing ? "bg-gray-100" : ""}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">Title</label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                required
                                                value={newCourse.title}
                                                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label htmlFor="credits" className="block text-sm font-medium leading-6 text-gray-900">Credits</label>
                                        <div className="mt-2">
                                            <input
                                                type="number"
                                                name="credits"
                                                id="credits"
                                                required
                                                value={newCourse.credits}
                                                onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    >
                                        {isEditing ? "Update Course" : "Save Course"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {loadingCourses ? (
                            <p className="text-gray-500">Loading courses...</p>
                        ) : (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Code</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {courses.map((course) => (
                                            <tr key={course.code}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{course.code}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{course.title}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{course.credits}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleEditCourse(course)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourse(course.code)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className="mr-4 text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreatingUser(!isCreatingUser)}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                {isCreatingUser ? "Cancel" : "Add User"}
                            </button>
                        </div>

                        {isCreatingUser && (
                            <form onSubmit={handleCreateUser} className="mb-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="userName" className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="userName"
                                                id="userName"
                                                required
                                                value={newUser.name}
                                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="userEmail" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                                        <div className="mt-2">
                                            <input
                                                type="email"
                                                name="userEmail"
                                                id="userEmail"
                                                required
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label htmlFor="userPassword" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
                                        <div className="mt-2">
                                            <input
                                                type="password"
                                                name="userPassword"
                                                id="userPassword"
                                                required
                                                value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <label htmlFor="userRole" className="block text-sm font-medium leading-6 text-gray-900">Role</label>
                                        <div className="mt-2">
                                            <select
                                                id="userRole"
                                                name="userRole"
                                                required
                                                value={newUser.role}
                                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            >
                                                <option value="student">Student</option>
                                                <option value="instructor">Instructor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        )}

                        {loadingUsers ? (
                            <p className="text-gray-500">Loading users...</p>
                        ) : (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Joined</th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{user.name}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{user.role}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "disciplinary" && (
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className="mr-4 text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Disciplinary Reports</h3>
                            </div>
                        </div>

                        <h4 className="text-md font-medium text-gray-900 mb-4">Pending Reports</h4>
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mb-8">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reported By</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {disciplinaryReports.filter(r => r.status === 'pending').length > 0 ? (
                                        disciplinaryReports.filter(r => r.status === 'pending').map((report) => (
                                            <tr key={report.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {report.student_name}
                                                    <div className="text-xs text-gray-500">{report.student_email}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.instructor_name}</td>
                                                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={report.reason}>{report.reason}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(report.created_at).toLocaleDateString()}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => setResolvingReport(report)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Suspend
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">No pending reports</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <h4 className="text-md font-medium text-gray-900 mb-4">Resolved Reports (History)</h4>
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date Resolved</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {disciplinaryReports.filter(r => r.status === 'resolved' || r.status === 'revoked').length > 0 ? (
                                        disciplinaryReports.filter(r => r.status === 'resolved' || r.status === 'revoked').map((report) => (
                                            <tr key={report.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {report.student_name}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">{report.reason}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {report.status === 'revoked' ? (
                                                        <span className="text-gray-500">Suspension Revoked</span>
                                                    ) : (
                                                        `Suspended for ${report.suspension_days} days`
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(report.created_at).toLocaleDateString()}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {report.status === 'resolved' && report.suspended_until && new Date(report.suspended_until) > new Date() && (
                                                        <button
                                                            onClick={() => handleRevokeSuspension(report.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">No resolved reports</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "deadlock" && (
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Deadlock Simulation</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            This tool simulates a deadlock scenario by firing two concurrent enrollment requests for the same section.
                            The database transaction logic handles this using `FOR UPDATE` locking.
                        </p>
                        <button
                            onClick={handleDeadlockSimulation}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Server className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Start Simulation
                        </button>
                        {simulationStatus && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{simulationStatus}</pre>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "optimization" && (
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Query Optimization Analysis</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Analyze SQL queries to identify performance bottlenecks and missing indexes.
                        </p>
                        <div className="mb-4">
                            <label htmlFor="query" className="block text-sm font-medium leading-6 text-gray-900">SQL Query</label>
                            <div className="mt-2">
                                <textarea
                                    id="query"
                                    name="query"
                                    rows={3}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleOptimize}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Search className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Analyze Query
                        </button>
                        {optimizationResult && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900">Analysis Result</h4>
                                <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-x-auto">
                                    <pre className="text-xs text-gray-700">{JSON.stringify(optimizationResult, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedList && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">{selectedList.title}</h3>
                            <button
                                onClick={() => setSelectedList(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedList.data.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {selectedList.data.map((item: any) => (
                                        <li key={item.id} className="py-4 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.email}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center">No data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {resolvingReport && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Suspend Student</h3>
                            <button onClick={() => setResolvingReport(null)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Suspend <strong>{resolvingReport.student_name}</strong> for the reported incident.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Suspension Duration (Days)</label>
                            <input
                                type="number"
                                min="1"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                value={suspensionDays}
                                onChange={(e) => setSuspensionDays(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleResolveReport}
                                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Confirm Suspension
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
