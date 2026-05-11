"use client";

const stats = [
  { value: "5000+", label: "Students Enrolled" },
  { value: "200+", label: "Expert Teachers" },
  { value: "50+", label: "Courses Offered" },
  { value: "95%", label: "Success Rate" },
];

export default function StatsSection() {
  return (
    <section className="py-14 sm:py-16 lg:py-20 relative overflow-hidden mesh-gradient">
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 geo-pattern" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="dark-glass rounded-2xl p-5 sm:p-6 text-center group hover:bg-white/[0.08] transition-all duration-400"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-fluid-2xl sm:text-fluid-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">
                {stat.label}
              </div>
              {/* Accent line */}
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-3 sm:mt-4 group-hover:w-12 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
