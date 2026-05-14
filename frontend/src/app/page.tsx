"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Search, Camera, Shield, Users, Sparkles } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden" data-nav-theme="dark">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source src="/ocean-video.mp4" type="video/mp4" />
        </video>
        
        {/* Cinematic Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 relative z-10">
          <div className="max-w-5xl">
            {/* Sub-header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex items-center gap-6 mb-12"
            >
              <div className="w-20 h-[1px] bg-[#6B8BA4]" />
              <span className="text-[10px] uppercase tracking-[0.5em] font-black text-white/90">
                A New Perspective
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-8xl lg:text-[10rem] font-medium tracking-tight leading-[0.85] mb-12"
            >
              Capturing the <br />
              <span className="font-serif-aesthetic italic text-[#6B8BA4]">essence of you.</span>
            </motion.h1>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="max-w-xl mb-16"
            >
              <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed tracking-wide">
                High-end facial recognition <span className="italic font-serif-aesthetic text-white">for the most exclusive events.</span> <br />
                Experience memories that move as fast as you do.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-8 items-center"
            >
              <Link
                href="/search"
                className="group flex items-center justify-center gap-4 px-12 py-6 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.2)]"
              >
                <Search className="w-4 h-4" /> Find Your Photos
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 right-24 flex flex-col items-center gap-6"
        >
          <span className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-bold rotate-90 origin-right translate-x-full">Scroll</span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </section>

      {/* ========== SAND SECTION (Vision) ========== */}
      <section className="relative py-40 overflow-hidden" data-nav-theme="light">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="/sand-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#FDFCFB]/90" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-serif-aesthetic italic text-zinc-900 mb-6">
              Etched in the sand.
            </h2>
            <div className="w-24 h-px bg-[#D9C5A3] mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Instant Delivery",
                desc: "No more waiting weeks for your photos. Get them the moment they're uploaded.",
                icon: Sparkles
              },
              {
                title: "Privacy First",
                desc: "Only you can see your photos. Our AI ensures secure, private delivery.",
                icon: Shield
              },
              {
                title: "Crystal Clear",
                desc: "Original high-resolution downloads for every single match found.",
                icon: Camera
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl mb-6 border border-zinc-100">
                  <feature.icon className="w-6 h-6 text-[#D9C5A3]" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-500 font-light leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== VISION SECTION ========== */}
      <section className="relative py-40 overflow-hidden" data-nav-theme="dark">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/vision-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-serif-aesthetic text-white leading-tight mb-8"
            >
              Crystal clear <br />
              <span className="italic text-[#D9C5A3]">vision.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xl text-white/50 font-light leading-relaxed mb-10 max-w-lg"
            >
              Our facial recognition technology is trained on millions of images to provide 99.9% accuracy at every event.
            </motion.p>
            <Link 
              href="/register"
              className="inline-flex items-center gap-4 text-[#D9C5A3] font-bold text-xs uppercase tracking-[0.3em] group"
            >
              Start for free <div className="w-10 h-px bg-[#D9C5A3] transition-all group-hover:w-16" />
            </Link>
          </div>
          <div className="flex-1 relative">
            <div className="w-full aspect-square rounded-[3rem] overflow-hidden border border-white/10 backdrop-blur-2xl bg-white/5 p-4">
              <div className="w-full h-full rounded-[2.2rem] border border-white/5 overflow-hidden relative group">
                <img 
                  src="/hero-bg.png" 
                  alt="Vision" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-[#D9C5A3] p-1">
                      <div className="w-full h-full rounded-full bg-[#D9C5A3]/20 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">AI Status</p>
                      <p className="text-sm font-medium text-white tracking-wide">Optimized Matching Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
