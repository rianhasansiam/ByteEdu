"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Decorative Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] auth-deco-panel items-center justify-center p-12 relative">
        {/* Floating orbs */}
        <div className="orb w-72 h-72 bg-gray-500" style={{ top: "15%", left: "10%", animationDelay: "0s" }} />
        <div className="orb w-48 h-48 bg-gray-400" style={{ bottom: "20%", right: "15%", animationDelay: "3s" }} />
        <div className="orb w-32 h-32 bg-gray-600" style={{ top: "60%", left: "30%", animationDelay: "5s" }} />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 border border-white/10">
            BE
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4">
            Welcome to ByteEdu
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Modern school management platform for institutions, teachers, and students across Bangladesh.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["📊 Analytics", "👥 Multi-Role", "🔒 Secure", "📱 Responsive"].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1.5 bg-white/[0.06] backdrop-blur-sm text-gray-300 text-xs rounded-full border border-white/[0.08]"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gray-200/30 rounded-full blur-3xl" />

        <div className="w-full max-w-[420px] relative z-10 animate-scale-in">
          {/* Card Container */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <Link href="/" className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4 inline-block">
                ByteEdu
              </Link>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-3 sm:mt-4">
                Welcome Back
              </h2>
              <p className="mt-1.5 sm:mt-2 text-gray-500 text-sm">
                Sign in to your account
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-scale-in">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="block w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-3 input-glass rounded-xl text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 input-glass rounded-xl text-gray-900 placeholder-gray-400 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link href="/login" className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors">
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 btn-primary rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Footer Links */}
              <div className="text-center pt-3 sm:pt-4 border-t border-gray-100/50">
                <p className="text-gray-500 text-xs sm:text-sm">
                  Need a Super Admin account?{" "}
                  <Link href="/superAdminSignup" className="font-semibold text-black hover:text-gray-700 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
