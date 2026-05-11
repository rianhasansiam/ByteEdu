const teamMembers = [
  {
    name: "Alex Johnson",
    role: "Lead Developer",
    avatar: "👨‍💻",
    description: "Full-stack developer with 8+ years of experience in EdTech solutions.",
  },
  {
    name: "Sarah Chen",
    role: "UI/UX Designer",
    avatar: "👩‍🎨",
    description: "Creating intuitive and beautiful interfaces for educational platforms.",
  },
  {
    name: "Michael Brown",
    role: "Backend Engineer",
    avatar: "👨‍🔧",
    description: "Database architect and API specialist ensuring robust performance.",
  },
  {
    name: "Emily Davis",
    role: "Project Manager",
    avatar: "👩‍💼",
    description: "Coordinating development efforts and ensuring timely delivery.",
  },
];

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

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-5 sm:p-6 text-center group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                {member.avatar}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-black">{member.name}</h3>
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">{member.role}</p>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
