"use client";

import { useEffect, useState } from "react";

interface Slot { id: string; subjectName: string; teacherName: string; startTime: string; endTime: string; roomNumber: string | null; }
interface DayRoutine { day: string; dayIndex: number; slots: Slot[]; }

export default function StudentRoutine() {
  const [routine, setRoutine] = useState<DayRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(new Date().getDay());

  useEffect(() => {
    fetch("/api/student/routine")
      .then((r) => r.json())
      .then((d) => setRoutine(d.routine || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const activeRoutine = routine.find((r) => r.dayIndex === activeDay);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Class Routine</h1>
        <p className="text-gray-500 mt-1">Your weekly class timetable</p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {routine.map((day) => (
          <button
            key={day.dayIndex}
            onClick={() => setActiveDay(day.dayIndex)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeDay === day.dayIndex
                ? "bg-black text-white shadow-sm"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            {day.day}
            {day.slots.length > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                activeDay === day.dayIndex ? "bg-white/20" : "bg-gray-100"
              }`}>
                {day.slots.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {!activeRoutine || activeRoutine.slots.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No classes scheduled for {activeRoutine?.day || "this day"}</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeRoutine.slots.map((slot, i) => (
              <div key={slot.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-colors">
                <div className="text-center min-w-[80px]">
                  <p className="text-sm font-bold text-gray-900">{slot.startTime}</p>
                  <p className="text-xs text-gray-400">{slot.endTime}</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{slot.subjectName}</p>
                  <p className="text-sm text-gray-500">{slot.teacherName}</p>
                </div>
                {slot.roomNumber && (
                  <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                    Room {slot.roomNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
