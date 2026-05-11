const features = [
  {
    icon: "👥",
    title: "Student Management",
    description: "Complete student profiles, enrollment tracking, and academic history management.",
  },
  {
    icon: "👨‍🏫",
    title: "Teacher Portal",
    description: "Manage assignments, track attendance, and communicate with students efficiently.",
  },
  {
    icon: "📊",
    title: "Attendance Tracking",
    description: "Real-time attendance monitoring for students and staff with detailed reports.",
  },
  {
    icon: "💰",
    title: "Fee Management",
    description: "Streamlined fee collection, payment tracking, and financial reporting.",
  },
  {
    icon: "📝",
    title: "Results & Grades",
    description: "Comprehensive examination management and grade tracking system.",
  },
  {
    icon: "📦",
    title: "Inventory System",
    description: "Track and manage institutional assets, books, and equipment.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 bg-gray-50/80 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gray-200/30 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-200/20 rounded-full blur-3xl translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">
            What We Offer
          </span>
          <h2 className="text-fluid-2xl font-bold text-black mb-3 sm:mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to manage your educational institution efficiently
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-black to-transparent mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card rounded-2xl p-5 sm:p-6 lg:p-7 glow-border relative overflow-hidden"
            >
              {/* Hover gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-2xl sm:text-3xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
