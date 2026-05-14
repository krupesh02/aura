"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Sparkles, Camera } from "lucide-react";
import { motion } from "framer-motion";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const handleInstagramRedirect = () => {
    setRedirecting(true);
    window.open("https://www.instagram.com/tulsivivah_photography", "_blank");
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(62,56,50,0.08)] p-10 md:p-14 text-center border border-[#E8E2D6] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D97A62]" />
        
        <div className="w-20 h-20 rounded-[2rem] bg-[#4A443A] mx-auto flex items-center justify-center mb-10 shadow-xl shadow-[#4A443A]/20">
          <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
        </div>
        
        <h1 className="text-4xl font-light mb-4 tracking-tight font-serif-aesthetic italic text-[#3E3832]">Access Granted.</h1>
        <p className="text-[#827A6E] font-light mb-10 leading-relaxed text-sm">
          Your access is now active. High-resolution downloads and AI facial indexing are fully unlocked.
        </p>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            className="w-full py-4 bg-[#4A443A] text-[#FDFBF7] rounded-[1.5rem] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#3E3832] transition-all shadow-lg"
          >
            Explore My Gallery <ArrowRight className="w-4 h-4" />
          </motion.button>

          <div className="pt-8 mt-8 border-t border-[#E8E2D6]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D2A078] font-bold mb-6">Support Our Work</p>
            <button
              onClick={handleInstagramRedirect}
              disabled={redirecting}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-xs font-semibold tracking-widest uppercase border border-[#E8E2D6] text-[#827A6E] transition-all hover:bg-[#FDFBF7] active:scale-[0.98]"
            >
              <InstagramIcon className="w-4 h-4 text-[#D97A62]" /> 
              <span>{redirecting ? "Redirecting..." : "Follow on Instagram"}</span>
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-[#D2A078]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Aura Premium</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    </div>
  );
}
