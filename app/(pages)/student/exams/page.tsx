"use client";

import { useEffect, useState } from "react";

interface Exam {
  id: string; name: string; subjectName: string; date: string; startTime: string | null;
  endTime: string | null; roomNumber: string | null; syllabus: string | null; instructions: string | null;
}

export default function StudentExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = exams.filter((e) => new Date(e.date) >= today);
  const past = exams.filter((e) => new Date(e.date) < today);

  const getDaysUntil = (date: string) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff} days`;
  };

  const ExamCard = ({ exam, isPast }: { exam: Exam; isPast: boolean }) => (
    <div className={`bg-white rounded-xl border p-5 ${isPast ? "opacity-60" : "shadow-sm"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{exam.name}</h3>
          <p className="text-sm text-indigo-600 font-medium">{exam.subjectName}</p>
        </div>
        {!isPast && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
            {getDaysUntil(exam.date)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Date</p>
          <p className="text-gray-700 font-medium">
            {new Date(exam.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
        {exam.startTime && (
          <div>
            <p className="text-gray-400 text-xs">Time</p>
            <p className="text-gray-700 font-medium">{exam.startTime}{exam.endTime ? ` - ${exam.endTime}` : ""}</p>
          </div>
        )}
        {exam.roomNumber && (
          <div>
            <p className="text-gray-400 text-xs">Room</p>
            <p className="text-gray-700 font-medium">{exam.roomNumber}</p>
          </div>
        )}
      </div>
      {exam.syllabus && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-400 mb-1">Syllabus</p>
          <p className="text-sm text-gray-600">{exam.syllabus}</p>
        </div>
      )}
      {exam.instructions && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Instructions</p>
          <p className="text-sm text-gray-600">{exam.instructions}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exam Schedule</h1>
        <p className="text-gray-500 mt-1">Your upcoming and past exams</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No exams scheduled</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {upcoming.map((e) => <ExamCard key={e.id} exam={e} isPast={false} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Past Exams</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {past.map((e) => <ExamCard key={e.id} exam={e} isPast={true} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
