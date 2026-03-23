import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Types
export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  picture: string | null;
  teacherId: string | null;
  institution: {
    id: string;
    name: string;
  } | null;
  assignedSubjects: Array<{
    id: string;
    name: string;
    section: {
      id: string;
      name: string;
      className: string;
    };
  }>;
  classTeacherOf: Array<{
    id: string;
    name: string;
    className: string;
    studentCount: number;
  }>;
}

export interface TeacherStats {
  totalStudents: number;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  totalAssignedSections: number;
  totalSubjects: number;
  isClassTeacher: boolean;
}

export interface Section {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  isClassTeacher: boolean;
  subjects: Array<{ id: string; name: string }>;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  roll: string | null;
  phone: string | null;
  picture: string | null;
  section: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  } | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string | null;
  student: {
    id: string;
    name: string;
    roll: string | null;
  };
  section: {
    id: string;
    name: string;
    className: string;
  };
}

type TeacherState = {
  profile: TeacherProfile | null;
  stats: TeacherStats | null;
  sections: Section[];
  selectedSectionId: string | null;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  loading: {
    profile: boolean;
    sections: boolean;
    students: boolean;
    attendance: boolean;
  };
};

const initialState: TeacherState = {
  profile: null,
  stats: null,
  sections: [],
  selectedSectionId: null,
  students: [],
  attendanceRecords: [],
  loading: {
    profile: false,
    sections: false,
    students: false,
    attendance: false,
  },
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    setTeacherProfile: (state, action: PayloadAction<TeacherProfile | null>) => {
      state.profile = action.payload;
    },
    setTeacherStats: (state, action: PayloadAction<TeacherStats | null>) => {
      state.stats = action.payload;
    },
    setSections: (state, action: PayloadAction<Section[]>) => {
      state.sections = action.payload;
    },
    setSelectedSectionId: (state, action: PayloadAction<string | null>) => {
      state.selectedSectionId = action.payload;
    },
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
    },
    setAttendanceRecords: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.attendanceRecords = action.payload;
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: keyof TeacherState["loading"]; value: boolean }>
    ) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    clearTeacherState: (state) => {
      state.profile = null;
      state.stats = null;
      state.sections = [];
      state.selectedSectionId = null;
      state.students = [];
      state.attendanceRecords = [];
      state.loading = {
        profile: false,
        sections: false,
        students: false,
        attendance: false,
      };
    },
  },
});

export const {
  setTeacherProfile,
  setTeacherStats,
  setSections,
  setSelectedSectionId,
  setStudents,
  setAttendanceRecords,
  setLoading,
  clearTeacherState,
} = teacherSlice.actions;

export default teacherSlice.reducer;
