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
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-gray-500 font-semibold text-sm uppercase tracking-wider">
            Development Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mt-2 mb-4">
            Meet Our Team
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A passionate team of developers and designers committed to building 
            the best education management solution.
          </p>
          <div className="w-24 h-1 bg-black mx-auto mt-4"></div>
        </div>

        {/* Company Info */}
        <div className="bg-gray-100 rounded-2xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
              EM
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-gray-900">EduManage Solutions</h3>
              <p className="text-gray-600 mt-2 max-w-2xl">
                We are a software development company specializing in educational technology solutions. 
                Our mission is to transform how educational institutions operate through innovative 
                and user-friendly management systems.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                <span className="px-3 py-1 bg-black text-white rounded-full text-sm">
                  Next.js
                </span>
                <span className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
                  Prisma
                </span>
                <span className="px-3 py-1 bg-gray-600 text-white rounded-full text-sm">
                  PostgreSQL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                {member.avatar}
              </div>
              <h3 className="text-lg font-semibold text-black">{member.name}</h3>
              <p className="text-gray-500 text-sm font-medium mb-2">{member.role}</p>
              <p className="text-gray-500 text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
