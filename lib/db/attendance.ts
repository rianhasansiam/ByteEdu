"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@/app/generated/prisma/client";



export const getAttendances = unstable_cache(() =>
    prisma.attendance.findMany(),
  ["attendances"],
  { tags: ["attendances"] }
);




export const getAttendanceById = unstable_cache((id: string) =>
    prisma.attendance.findMany({where: { id: id } }),

  ["attendance-by-user"],
  { tags: ["attendances"] }
);





export async function createAttendance(data: { userId: number; status: AttendanceStatus;}) {
  const attendance = await prisma.attendance.create({data: { userId: data.userId,  status: data.status }});

  revalidateTag("attendances", "default");
  return attendance;
}







export async function updateAttendance(id: string,data: {  status?: AttendanceStatus; }) {
  const attendance = await prisma.attendance.update({ where: { id }, data,});

  revalidateTag("attendances", "default");
  return attendance;
}





export async function deleteAttendance(id: string) {
  await prisma.attendance.delete({ where: { id }});

  revalidateTag("attendances", "default");
}


/*
============================================
FRONTEND USAGE EXAMPLES
============================================



  const attendances = await getAttendances();
// ----------------------------------------
  async function handleSubmit(formData: FormData) {
    await createAttendance({
      userId: Number(formData.get("userId")),
      status: formData.get("status") as "PRESENT" | "ABSENT" | "LATE",
    });
  }
// ----------------------------------------
    <button onClick={() => deleteAttendance(id)}> Delete </button>
// ----------------------------------------
  const [status, setStatus] = useState(currentStatus);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    await updateAttendance(id, { status: newStatus as "PRESENT" | "ABSENT" | "LATE" });
  }




*/




