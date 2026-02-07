"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const userRole = session?.user?.role;

  // Check if user can access dashboard (not USER role)
  const canAccessDashboard = userRole && ["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"].includes(userRole);
console.log("User Role:", userRole);
  // Get signup options based on role
  const getSignupOptions = () => {
    if (!session) return [];
    
    switch (userRole) {
      case "SUPER_ADMIN":
        return [
          { href: "/adminSignup", label: "Admin" },
          { href: "/teacherSignup", label: "Teacher" },
          { href: "/studentSignup", label: "Student" },
        ];
      case "ADMIN":
        return [
          { href: "/teacherSignup", label: "Teacher" },
          { href: "/studentSignup", label: "Student" },
        ];
      case "TEACHER":
        return [
          { href: "/studentSignup", label: "Student" },
        ];
      case "STUDENT":
      default:
        return [];
    }
  };

  const signupOptions = getSignupOptions();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-black">
              ByteEdu
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {!session && (
              <>
                <a href="#about" onClick={(e) => scrollToSection(e, "about")} className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                  About
                </a>
                <a href="#features" onClick={(e) => scrollToSection(e, "features")} className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                  Features
                </a>
                <a href="#team" onClick={(e) => scrollToSection(e, "team")} className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                  Team
                </a>
              </>
            )}
            
            {isLoading ? (
              <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
            ) : session ? (
              <>
                {canAccessDashboard && (
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                
                {/* Signup Options Dropdown */}
                {signupOptions.length > 0 && (
                  <div className="relative group">
                    <button className="text-gray-600 hover:text-black transition-colors flex items-center gap-1">
                      Create Account
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      {signupOptions.map((option) => (
                        <Link
                          key={option.href}
                          href={option.href}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {session.user?.picture ? (
                    <Image
                      src={session.user.picture}
                      alt={session.user?.name || "User"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                      {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-gray-700 font-medium">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {!session && (
                <>
                  <a
                    href="#about"
                    className="text-gray-600 hover:text-black transition-colors py-2 cursor-pointer"
                    onClick={(e) => scrollToSection(e, "about")}
                  >
                    About
                  </a>
                  <a
                    href="#features"
                    className="text-gray-600 hover:text-black transition-colors py-2 cursor-pointer"
                    onClick={(e) => scrollToSection(e, "features")}
                  >
                    Features
                  </a>
                  <a
                    href="#team"
                    className="text-gray-600 hover:text-black transition-colors py-2 cursor-pointer"
                    onClick={(e) => scrollToSection(e, "team")}
                  >
                    Team
                  </a>
                </>
              )}
              
              {isLoading ? (
                <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg"></div>
              ) : session ? (
                <>
                  {canAccessDashboard && (
                    <Link
                      href="/dashboard"
                      className="text-gray-600 hover:text-black transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  {/* Mobile Signup Options */}
                  {signupOptions.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Create Account</p>
                      {signupOptions.map((option) => (
                        <Link
                          key={option.href}
                          href={option.href}
                          className="block text-gray-600 hover:text-black transition-colors py-2"
                        >
                          {option.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 py-2">
                    {session.user?.picture ? (
                      <Image
                        src={session.user.picture}
                        alt={session.user?.name || "User"}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="text-gray-700 font-medium">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
