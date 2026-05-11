// const teamMembers = [
//   {
//     name: "Alex Johnson",
//     role: "Lead Developer",
//     avatar: "👨‍💻",
//     description: "Full-stack developer with 8+ years of experience in EdTech solutions.",
//   },
//   {
//     name: "Sarah Chen",
//     role: "UI/UX Designer",
//     avatar: "👩‍🎨",
//     description: "Creating intuitive and beautiful interfaces for educational platforms.",
//   },
//   {
//     name: "Michael Brown",
//     role: "Backend Engineer",
//     avatar: "👨‍🔧",
//     description: "Database architect and API specialist ensuring robust performance.",
//   },
//   {
//     name: "Emily Davis",
//     role: "Project Manager",
//     avatar: "👩‍💼",
//     description: "Coordinating development efforts and ensuring timely delivery.",
//   },
// ];

export default function TeamSection() {
  return (
    <section id="team" className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gray-100/50 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">
            Development Team
          </span>
          <h2 className="text-fluid-2xl font-bold text-black mb-3 sm:mb-4">
            Meet Our Team
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
            A passionate team of developers and designers committed to building 
            the best education management solution.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-black to-transparent mx-auto mt-4 rounded-full" />
        </div>

        {/* Company Info */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-10 sm:mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gray-100/30 rounded-bl-[100px] -z-0" />
          
          <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-bold flex-shrink-0 shadow-lg">
              BE
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">ByteEdu Management Solutions</h3>
              <p className="text-gray-500 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                We are a software development company specializing in educational technology solutions. 
                Our mission is to transform how educational institutions operate through innovative 
                and user-friendly management systems.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 justify-center md:justify-start">
                {["Next.js", "TypeScript", "Prisma", "PostgreSQL"].map((tech, i) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-full text-xs font-medium shadow-sm"
                    style={{ opacity: 1 - i * 0.1 }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white -z-0" />
          <div className="relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
              <span className="text-4xl sm:text-5xl">👥</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Coming Soon
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Our talented team members will be introduced here shortly. Stay tuned!
            </p>
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-gray-300"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </section>
  );
}
