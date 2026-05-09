export interface Class {
  id: string;
  name: string;
  displayOrder: number;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassData {
  id: string;
  name: string;
  displayOrder: number;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  sections: SectionData[];
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  classTeacherId: string | null;
  createdAt: Date;
  updatedAt: Date;
  classTeacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  class?: {
    name: string;
  };
  _count?: {
    students: number;
  };
}

export interface SectionData {
  id: string;
  name: string;
  classId: string;
  classTeacherId: string | null;
  createdAt: Date;
  updatedAt: Date;
  classTeacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  class?: {
    name: string;
  };
  _count?: {
    students: number;
  };
}

export interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  roll?: string | null;
  sectionId?: string | null;
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  } | null;
}

export interface ClassFilterState {
  searchTerm: string;
  sortBy: "name" | "sections" | "latest";
}
