"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Institution = {
  id: string;
  name: string;
  status: string;
};

type Section = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
  institutionId: string;
  sections: Section[];
};

export default function StudentSignup() {
  const { data: session, status: sessionStatus } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    institutionId: "",
    classId: "",
    sectionId: "",
    roll: "",
    password: "",
    confirmPassword: "",
  });
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  // Fetch institutions only for SUPER_ADMIN
  useEffect(() => {
    const fetchInstitutions = async () => {
      setLoadingInstitutions(true);
      try {
        const response = await fetch("/api/institutions");
        const data = await response.json();
        if (data.institutions) {
          setInstitutions(data.institutions);
        }
      } catch (err) {
        console.error("Failed to fetch institutions:", err);
        setError("Failed to load institutions");
      } finally {
        setLoadingInstitutions(false);
      }
    };

    if (session?.user.role === "SUPER_ADMIN") {
      fetchInstitutions();
    }
  }, [session]);

  // Fetch classes when institution is selected (for Super Admin) or on load (for Admin/Teacher)
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        let url = "/api/classes";
        if (isSuperAdmin && formData.institutionId) {
          url += `?institutionId=${formData.institutionId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        if (data.classes) {
          setClasses(data.classes);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setError("Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    };

    // For Super Admin, only fetch when institution is selected
    // For Admin/Teacher, fetch immediately
    if (session) {
      if (isSuperAdmin) {
        if (formData.institutionId) {
          fetchClasses();
        } else {
          setClasses([]);
        }
      } else {
        fetchClasses();
      }
    }
  }, [session, isSuperAdmin, formData.institutionId]);

  // Get sections for selected class
  const selectedClass = classes.find((c) => c.id === formData.classId);
  const sections = selectedClass?.sections || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Reset dependent fields
      if (name === "institutionId") {
        newData.classId = "";
        newData.sectionId = "";
      } else if (name === "classId") {
        newData.sectionId = "";
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }


    setLoading(true);

    try {
      const response = await fetch("/api/auth/student-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          sectionId: formData.sectionId || null,
          roll: formData.roll || null,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess("Student account created successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        institutionId: "",
        classId: "",
        sectionId: "",
        roll: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Determine back link based on user role
  const getBackLink = () => {
    if (session?.user.role === "SUPER_ADMIN") {
      return "/superAdmin/dashboard";
    } else if (session?.user.role === "ADMIN") {
      return "/admin/dashboard";
    } else if (session?.user.role === "TEACHER") {
      return "/teacher/dashboard";
    }
    return "/login";
  };

  // Show loading while checking session
  if (sessionStatus === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-gray-200/30 rounded-full blur-3xl" />
      <div className="max-w-md w-full relative z-10 animate-scale-in">
        {/* Card Container */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 inline-block">
              ByteEdu
            </Link>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3 sm:mt-4">
              Create Student Account
            </h2>
            <p className="mt-1.5 sm:mt-2 text-gray-500 text-sm">
              Register a new student
            </p>
          </div>

          <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 text-sm animate-scale-in">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 text-sm animate-scale-in">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {/* Institution Field - Only for Super Admin */}
            {isSuperAdmin && (
              <div>
                <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    id="institutionId"
                    name="institutionId"
                    required
                    value={formData.institutionId}
                    onChange={handleChange}
                    disabled={loadingInstitutions}
                    className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">
                      {loadingInstitutions ? "Loading institutions..." : "Select an institution"}
                    </option>
                    {institutions
                      .filter((inst) => inst.status === "active")
                      .map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Class and Section Row - Optional */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Class &amp; Section</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional — assign later</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Class Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <select
                      id="classId"
                      name="classId"
                      value={formData.classId}
                      onChange={handleChange}
                      disabled={loadingClasses || (isSuperAdmin && !formData.institutionId)}
                      className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">
                        {loadingClasses ? "Loading..." : "Select class"}
                      </option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Section Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <select
                      id="sectionId"
                      name="sectionId"
                      value={formData.sectionId}
                      onChange={handleChange}
                      disabled={!formData.classId}
                      className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">
                        {!formData.classId ? "Select class first" : "Select section"}
                      </option>
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">You can assign the student to a class and section later from the Users dashboard.</p>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Enter student's full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Enter student's email"
                />
              </div>
            </div>

            {/* Phone and Roll Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Roll Field - Optional */}
              <div>
                <label htmlFor="roll" className="block text-sm font-medium text-gray-700 mb-1">
                  Roll No. <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <input
                    id="roll"
                    name="roll"
                    type="text"
                    value={formData.roll}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="e.g., 01"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isSuperAdmin && loadingInstitutions) || loadingClasses}
              className="w-full py-2.5 sm:py-3 px-4 btn-primary rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Student...
                </span>
              ) : (
                "Create Student Account"
              )}
            </button>

            {/* Footer Link */}
            <div className="text-center pt-3 sm:pt-4 border-t border-gray-100/50">
              <p className="text-gray-500 text-xs sm:text-sm">
                Back to{" "}
                <Link href={getBackLink()} className="font-medium text-black hover:text-gray-700 transition-colors">
                  Dashboard
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
