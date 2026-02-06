"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

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
    <section className="relative h-[600px] md:h-[65vh] bg-black text-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Education background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Swiper Content */}
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet !w-3 !h-3 !bg-white/40 !opacity-100",
          bulletActiveClass: "!bg-white",
        }}
        loop={true}
        speed={800}
        dir="ltr"
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} dir="ltr">
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="w-full md:w-2/3 md:ml-auto text-center md:text-right">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  {slide.title}
                </h1>
                <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl ml-auto leading-relaxed">
                  {slide.description}
                </p>
                <a
                  href="/login"
                  className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-3 rounded-full transition-colors duration-200"
                >
                  Get Started Today
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-pagination {
          bottom: 32px !important;
        }
        .swiper-pagination-bullet {
          margin: 0 6px !important;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet:hover {
          background: rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>
    </section>
  );
}
