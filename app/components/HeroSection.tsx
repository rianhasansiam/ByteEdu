"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const slides = [
  {
    title: "স্মার্ট স্কুল ম্যানেজমেন্ট সিস্টেম",
    description:
      "বাংলাদেশের স্কুলগুলোর জন্য তৈরি একটি পূর্ণাঙ্গ ডিজিটাল প্ল্যাটফর্ম, যা ভর্তি, উপস্থিতি, পরীক্ষা, ফলাফল ও একাডেমিক রেকর্ড সহজে পরিচালনা করতে সহায়তা করে।",
  },
  {
    title: "Smart School Management System",
    description:
      "A comprehensive digital platform designed for Bangladeshi schools to efficiently manage admissions, attendance, examinations, results, and academic records.",
  },
  {
    title: "দক্ষ ও স্বচ্ছ শিক্ষা প্রতিষ্ঠান ব্যবস্থাপনা",
    description:
      "স্কুল প্রশাসনকে সহজ করুন, ম্যানুয়াল কাজ কমান এবং একটি নিরাপদ ও নির্ভরযোগ্য সিস্টেমের মাধ্যমে স্বচ্ছতা নিশ্চিত করুন।",
  },
  {
    title: "Empowering Educational Institutions",
    description:
      "Simplify school administration, reduce manual workload, and ensure transparency with a secure and reliable education management solution.",
  },
  {
    title: "আধুনিক ক্যাম্পাস, উন্নত শিক্ষা",
    description:
      "বাংলাদেশের শিক্ষা কাঠামোর সাথে সামঞ্জস্যপূর্ণ এই সিস্টেম স্কুল পরিচালনায় দক্ষতা বৃদ্ধি করে এবং শিক্ষার মান উন্নয়নে সহায়তা করে।",
  },
  {
    title: "Modern Campus, Better Outcomes",
    description:
      "Built to support the academic structure of Bangladesh, enabling schools to improve operational efficiency and enhance learning management.",
  },
];

export default function HeroSection() {
  return (
    <section className="relative h-[500px] sm:h-[550px] md:h-[600px] lg:h-[65vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Education background"
          fill
          className="object-cover"
          priority
        />
        {/* Animated mesh gradient overlay */}
        <div className="absolute inset-0 mesh-gradient opacity-90" />
        {/* Geometric pattern */}
        <div className="absolute inset-0 geo-pattern" />
      </div>

      {/* Floating decorative orbs */}
      <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-white/[0.03] blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-[10%] w-48 h-48 rounded-full bg-white/[0.04] blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      {/* Swiper Content */}
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet !w-2.5 !h-2.5 !bg-white/30 !opacity-100",
          bulletActiveClass: "!bg-white !w-6 !rounded-full",
        }}
        loop={true}
        speed={800}
        dir="ltr"
        className="h-full w-full relative z-10"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} dir="ltr">
            <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex items-center">
              <div className="w-full md:w-2/3 md:ml-auto text-center md:text-right">
                <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-4 sm:mb-6 text-white leading-tight animate-fade-in">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-300/90 mb-6 sm:mb-8 max-w-xl ml-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.15s" }}>
                  {slide.description}
                </p>
                <a
                  href="/login"
                  className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-white/5 text-sm sm:text-base animate-fade-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  Get Started Today
                  <svg className="inline-block w-4 h-4 ml-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-20" />
    </section>
  );
}
