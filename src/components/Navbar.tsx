"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, LogOut, User } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    if (!session) return null;

    const role = session.user.role;

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 left-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600">UniSys</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {role === 'student' && (
                                <>
                                    <Link
                                        href="/dashboard/student"
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard/student')
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/dashboard/student/timetable"
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard/student/timetable')
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Timetable
                                    </Link>
                                </>
                            )}
                            {role === 'instructor' && (
                                <Link
                                    href="/dashboard/instructor"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard/instructor')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    My Sections
                                </Link>
                            )}
                            {role === 'admin' && (
                                <Link
                                    href="/dashboard/admin"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard/admin')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="mr-4 text-sm text-gray-500">
                                {session.user.name} ({role})
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
