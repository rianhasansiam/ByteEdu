"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const userRole = session?.user?.role;

  // Track scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const canAccessDashboard = userRole && ["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"].includes(userRole);

  const getDashboardLink = () => {
    switch (userRole) {
      case "SUPER_ADMIN": return "/superAdmin/dashboard";
      case "ADMIN": return "/admin/dashboard";
      case "TEACHER": return "/teacher/dashboard";
      case "STUDENT": return "/student/dashboard";
      default: return "/dashboard";
    }
  };

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
        return [{ href: "/studentSignup", label: "Student" }];
      default: return [];
    }
  };

  const signupOptions = getSignupOptions();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass-panel shadow-lg border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="lg:max-w-[80vw] max-w-7xl  mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between h-16 sm:h-18">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                <span className="relative">
                  ByteEdu
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-gray-900 via-gray-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {!session && (
                <>
                  {["about", "features", "team"].map((section) => (
                    <a
                      key={section}
                      href={`#${section}`}
                      onClick={(e) => scrollToSection(e, section)}
                      className="relative px-3 lg:px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer group"
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-black rounded-full group-hover:w-3/4 transition-all duration-300" />
                    </a>
                  ))}
                </>
              )}

              {isLoading ? (
                <div className="w-20 h-9 shimmer rounded-xl" />
              ) : session ? (
                <>
                  {canAccessDashboard && (
                    <Link
                      href={getDashboardLink()}
                      className="relative px-3 lg:px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors group"
                    >
                      Dashboard
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-black rounded-full group-hover:w-3/4 transition-all duration-300" />
                    </Link>
                  )}

                  {/* Signup Options Dropdown */}
                  {signupOptions.length > 0 && (
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 lg:px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                        Create Account
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-1 w-48 glass-panel rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 overflow-hidden">
                        {signupOptions.map((option) => (
                          <Link
                            key={option.href}
                            href={option.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-black/5 hover:text-black transition-colors"
                          >
                            {option.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 ml-2">
                    {session.user?.picture ? (
                      <Image
                        src={session.user.picture}
                        alt={session.user?.name || "User"}
                        width={36}
                        height={36}
                        className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover ring-2 ring-gray-200 ring-offset-1"
                      />
                    ) : (
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-black text-white flex items-center justify-center text-xs lg:text-sm font-semibold ring-2 ring-gray-200 ring-offset-1">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="text-sm text-gray-700 font-medium hidden lg:block max-w-[120px] truncate">
                      {session.user?.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="btn-primary px-4 lg:px-5 py-2 rounded-xl text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary px-5 lg:px-6 py-2 rounded-xl text-sm font-medium"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 origin-center ${isOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                  <span className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 ${isOpen ? "opacity-0 scale-x-0" : ""}`} />
                  <span className={`w-full h-0.5 bg-gray-800 rounded-full transition-all duration-300 origin-center ${isOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-400 ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 mobile-menu-overlay transition-opacity duration-400 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-400 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <span className="text-lg font-bold text-black">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-1 stagger-children">
              {!session && (
                <>
                  {["about", "features", "team"].map((section) => (
                    <a
                      key={section}
                      href={`#${section}`}
                      className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-colors text-[15px] font-medium"
                      onClick={(e) => scrollToSection(e, section)}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </a>
                  ))}
                </>
              )}

              {isLoading ? (
                <div className="w-full h-12 shimmer rounded-xl" />
              ) : session ? (
                <>
                  {canAccessDashboard && (
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-colors text-[15px] font-medium"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                  )}

                  {signupOptions.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-2 px-4">Create Account</p>
                      {signupOptions.map((option) => (
                        <Link
                          key={option.href}
                          href={option.href}
                          className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl transition-colors text-[15px]"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          {option.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-5 border-t border-gray-100">
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {session.user?.picture ? (
                    <Image
                      src={session.user.picture}
                      alt={session.user?.name || "User"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn-primary py-3 rounded-xl text-sm font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full btn-primary py-3 rounded-xl text-sm font-semibold text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16 sm:h-18" />
    </>
  );
}
