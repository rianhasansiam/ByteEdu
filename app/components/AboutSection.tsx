export default function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50/50 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">
            Who We Are
          </span>
          <h2 className="text-fluid-2xl font-bold text-black mb-4">
            About Our Institution
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-black to-transparent mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Visual Side */}
          <div className="relative animate-slide-left">
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
              {/* Geometric accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-bl-[80px]" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.02] rounded-tr-[60px]" />
              
              <div className="relative z-10">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">🎓</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Excellence in Education</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Building tomorrow&apos;s leaders through quality education and innovative teaching methods.
                </p>
              </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-3 -right-3 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl -z-10" />
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-gray-200/50 rounded-xl -z-10" />
          </div>

          {/* Content Side */}
          <div className="animate-slide-right">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
              Empowering Education Through Technology
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
              Our institution has been at the forefront of educational excellence for years, 
              nurturing young minds and preparing them for the challenges of tomorrow. 
              With state-of-the-art facilities and dedicated faculty, we provide a 
              holistic learning environment.
            </p>
            <ul className="space-y-3 sm:space-y-4 stagger-children">
              {[
                "Experienced and qualified faculty members",
                "Modern infrastructure and smart classrooms",
                "Comprehensive curriculum with practical learning",
                "Focus on character development and ethics",
                "Strong alumni network and placement support",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 group">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
