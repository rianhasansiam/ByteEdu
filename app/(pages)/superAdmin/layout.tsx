import Sidebar from "./Sidebar";
import Breadcrumb from "@/app/components/Breadcrumb";
import { Toaster } from "react-hot-toast";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0">
        <Breadcrumb />
        <div className="page-enter">{children}</div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "12px", padding: "12px 16px", fontSize: "14px" },
          success: { style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" } },
          error: { style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" } },
        }}
      />
    </div>
  );
}
