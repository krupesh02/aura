"use client";

import Link from "next/link";
import { Aperture, Camera, Globe, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer 
      className="relative py-24 overflow-hidden bg-zinc-950"
    >
      {/* Background Video */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/footer-video.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="flex flex-col gap-8">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-[#F5F1E1] flex items-center justify-center transition-transform group-hover:rotate-12">
                <Aperture className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold tracking-[0.3em] uppercase text-[#F5F1E1]">Aura</span>
            </Link>
            <p className="text-white/40 font-light leading-relaxed max-w-xs">
              Redefining event memories through high-performance artificial intelligence.
            </p>
            <div className="flex gap-4">
              {[Camera, Globe, Share2].map((Icon, i) => (
                <Link key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-[#F5F1E1] hover:border-[#F5F1E1] transition-all">
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-[#F5F1E1]">Platform</h4>
            <div className="flex flex-col gap-4">
              {['Dashboard', 'Find Photos', 'Security', 'Pricing'].map(item => (
                <Link key={item} href="#" className="text-white/40 hover:text-white transition-colors font-light text-sm">{item}</Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-[#F5F1E1]">Company</h4>
            <div className="flex flex-col gap-4">
              {['About Us', 'Contact', 'Privacy Policy', 'Terms'].map(item => (
                <Link key={item} href="#" className="text-white/40 hover:text-white transition-colors font-light text-sm">{item}</Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-[#F5F1E1]">Newsletter</h4>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Your email address" 
                suppressHydrationWarning
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-light focus:outline-none focus:border-[#F5F1E1] transition-colors"
              />
              <button 
                suppressHydrationWarning
                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-[#F5F1E1] text-black transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed italic">
              *By subscribing you agree to our privacy policy and terms of service.
            </p>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
            © 2024 Aura Platforms Inc. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">System Status: Optimal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
