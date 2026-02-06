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
    <section id="features" className="py-20 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your educational institution efficiently
          </p>
          <div className="w-24 h-1 bg-black mx-auto mt-4"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-black transition-all duration-300"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
