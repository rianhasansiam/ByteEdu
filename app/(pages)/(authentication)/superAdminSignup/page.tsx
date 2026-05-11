"use client";

import Link from "next/link";

/**
 * Super Admin Signup is disabled in production.
 * The first Super Admin must be created using the seed script:
 *   npm run seed:admin
 */
export default function SuperAdminSignup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-gray-200/30 rounded-full blur-3xl" />
      <div className="max-w-md w-full relative z-10 animate-scale-in">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <Link href="/" className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 inline-block">
              ByteEdu
            </Link>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3 sm:mt-4">
              Registration Disabled
            </h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-4 rounded-xl text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Super Admin Registration is Disabled</p>
                <p className="text-amber-700">
                  For security reasons, Super Admin accounts cannot be created through this page. 
                  Please contact your system administrator or use the CLI seed script.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-5 mt-5 border-t border-gray-100/50">
            <p className="text-gray-500 text-xs sm:text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-black hover:text-gray-700 transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
