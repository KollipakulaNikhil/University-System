"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";

interface TimetableEntry {
    code: string;
    title: string;
    term: string;
    section_number: number;
    day: string;
    start_time: string;
    end_time: string;
    room_name: string;
}

export default function StudentTimetable() {
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const res = await fetch("/api/timetable");
            const data = await res.json();
            setTimetable(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch timetable", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading timetable...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        My Timetable
                    </h2>
                </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {timetable.map((entry, index) => (
                    <div
                        key={index}
                        className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow"
                    >
                        <div className="flex w-full items-center justify-between space-x-6 p-6">
                            <div className="flex-1 truncate">
                                <div className="flex items-center space-x-3">
                                    <h3 className="truncate text-sm font-medium text-gray-900">{entry.code}</h3>
                                    <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        Sec {entry.section_number}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-sm text-gray-500">{entry.title}</p>
                            </div>
                        </div>
                        <div>
                            <div className="-mt-px flex divide-x divide-gray-200">
                                <div className="flex w-0 flex-1">
                                    <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900">
                                        <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        {entry.day}
                                    </div>
                                </div>
                                <div className="flex w-0 flex-1">
                                    <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 border border-transparent py-4 text-sm font-semibold text-gray-900">
                                        <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
                                    </div>
                                </div>
                                <div className="flex w-0 flex-1">
                                    <div className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900">
                                        <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        {entry.room_name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {timetable.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12">
                        No classes scheduled. Enroll in courses to see them here.
                    </div>
                )}
            </div>
        </div>
    );
}
