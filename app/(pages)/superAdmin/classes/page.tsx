import {
  getInstitutionsWithUsers,
  getInstitutionStats,
} from "@/lib/db/institutions";
import {
  getClassesByInstitution,
  getAvailableTeachers,
  getStudentsByInstitution,
  getSubjectsByInstitution,
} from "@/lib/db/classes";
import Hydrate from "@/lib/store/hydrator";
import InstitutionSelector from "./components/InstitutionSelector";
import ClassesList from "./components/ClassesList";
import ClassActionsBar from "./components/ClassActionsBar";
import { ClassData } from "./components/types";

type PageProps = {
  searchParams: Promise<{
    institutionId?: string;
  }>;
};

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedInstitutionId = params.institutionId;

  const [institutions, institutionStats] = await Promise.all([
    getInstitutionsWithUsers(),
    getInstitutionStats(),
  ]);

  let classes: any[] = [];
  let teachers: any[] = [];
  let students: any[] = [];
  let subjects: any[] = [];

  if (selectedInstitutionId) {
    [classes, teachers, students, subjects] = await Promise.all([
      getClassesByInstitution(selectedInstitutionId),
      getAvailableTeachers(selectedInstitutionId),
      getStudentsByInstitution(selectedInstitutionId),
      getSubjectsByInstitution(selectedInstitutionId),
    ]);
  }

  const selectedInstitution = institutions.find(
    (i: any) => i.id === selectedInstitutionId
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Classes & Sections</h1>
        <p className="text-gray-600 mt-1">
          Manage classes and sections for your institutions
        </p>
      </div>

      <Hydrate name="institutions" data={institutions} />
      <Hydrate name="institutionStats" data={institutionStats} />

      {/* Institution Selector */}
      <InstitutionSelector
        institutions={institutions}
        selectedId={selectedInstitutionId}
      />

      {/* Classes Section */}
      {selectedInstitutionId && selectedInstitution ? (
        <div className="mt-8">
          {/* Stats and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {classes.length}
                </span>{" "}
                classes created
              </p>
            </div>
            <ClassActionsBar
              institutionId={selectedInstitutionId}
              classCount={classes.length}
            />
          </div>

          {/* Classes List */}
          <ClassesList
            classes={classes as ClassData[]}
            institutionId={selectedInstitutionId}
            teachers={teachers}
            students={students}
            subjects={subjects}
          />
        </div>
      ) : (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <p className="text-gray-500 text-lg">Select an institution</p>
          <p className="text-gray-400 text-sm mt-2">
            Choose an institution to manage its classes and sections
          </p>
        </div>
      )}
    </div>
  );
}
