export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            About Our Institution
          </h2>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image/Visual Side */}
          <div className="relative">
            <div className="bg-black rounded-2xl p-8 text-white">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold mb-2">Excellence in Education</h3>
              <p className="text-gray-300">
                Building tomorrow&apos;s leaders through quality education and innovative teaching methods.
              </p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gray-200 rounded-xl -z-10"></div>
          </div>

          {/* Content Side */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Empowering Education Through Technology
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our institution has been at the forefront of educational excellence for years, 
              nurturing young minds and preparing them for the challenges of tomorrow. 
              With state-of-the-art facilities and dedicated faculty, we provide a 
              holistic learning environment.
            </p>
            <ul className="space-y-3">
              {[
                "Experienced and qualified faculty members",
                "Modern infrastructure and smart classrooms",
                "Comprehensive curriculum with practical learning",
                "Focus on character development and ethics",
                "Strong alumni network and placement support",
              ].map((item, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
