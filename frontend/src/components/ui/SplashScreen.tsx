"use client";

import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Aperture } from "lucide-react";
import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const targetText = "AURA";

  // Parallax & 3D Tilt Core
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // ALL HOOKS MUST BE AT TOP LEVEL
  const springX = useSpring(mouseX, { stiffness: 60, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 30 });
  const bgSpringX = useSpring(mouseX, { stiffness: 20 });
  const bgSpringY = useSpring(mouseY, { stiffness: 20 });

  // 3D Tilt Transforms for Logo
  const rotateX = useTransform(springY, [-100, 100], [15, -15]);
  const rotateY = useTransform(springX, [-100, 100], [-15, 15]);

  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 200;
      const y = (clientY / window.innerHeight - 0.5) * 200;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);

    let iterations = 0;
    const decodeInterval = setInterval(() => {
      setDisplayText(
        targetText.split("")
          .map((char, index) => {
            if (index < iterations) return targetText[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (iterations >= targetText.length) clearInterval(decodeInterval);
      iterations += 1/4;
    }, 60);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(decodeInterval);
      clearTimeout(timer);
    };
  }, [mouseX, mouseY, targetText]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
          }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden cursor-none transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
        >
          {isMounted && (
            <>
              {/* ========== BACKGROUND VIDEO & ORGANIC GRADIENTS ========== */}
              <div className="absolute inset-0 z-0 bg-black">
                {/* Background Video */}
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                >
                  <source src="/splash-video.mp4" type="video/mp4" />
                </video>

                {/* Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)] z-1" />
                
                {/* Deep Amber / Sunset Blob (Reduced opacity to blend with video) */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                        x: ["-10%", "10%", "-10%"],
                        y: ["-5%", "5%", "-5%"]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[5%] w-[70%] h-[70%] bg-amber-500/5 blur-[120px] rounded-full"
                />
                 {/* Soft Rose Gold / Coral Blob */}
                 <motion.div 
                    animate={{ 
                        scale: [1.4, 1, 1.4],
                        rotate: [0, -90, 0],
                        x: ["20%", "-20%", "20%"],
                        y: ["15%", "-15%", "15%"]
                    }}
                    transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[80%] bg-rose-400/5 blur-[200px] rounded-full"
                 />
                 
                 {/* Dynamic Parallax Warm Leak */}
                 <motion.div 
                    style={{ x: bgSpringX, y: bgSpringY }}
                    className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-[#F5F1E1]/10 opacity-60"
                 />

                 {/* Grain */}
                 <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              </div>

              {/* ========== MAIN CONTENT WRAPPER ========== */}
              <div className="relative z-50 flex flex-col items-center perspective-[1200px]">
                 
                 {/* ========== 3D TILT LOGO ========== */}
                  <motion.div
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                  >
                     {/* Cinematic Glow */}
                     <div 
                         style={{ transform: "translateZ(-30px)" }}
                         className="absolute inset-[-30%] bg-amber-500/5 blur-[120px] rounded-full" 
                     />

                     <div className="w-44 h-44 rounded-[3.5rem] bg-white/[0.03] backdrop-blur-xl flex items-center justify-center relative overflow-hidden group border border-white/20">
                        {/* Light Sweep */}
                        <motion.div 
                          animate={{ x: ["-100%", "300%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full h-full skew-x-12"
                        />

                        <motion.div
                          initial={{ rotate: -180, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                          style={{ transform: "translateZ(40px)" }}
                        >
                          <Aperture className="w-24 h-24 text-[#F5F1E1]" strokeWidth={0.2} />
                        </motion.div>
                     </div>

                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-60px] border-[0.5px] border-amber-500/10 rounded-full"
                     />
                  </motion.div>

                  {/* Title */}
                  <div className="mt-28 text-center">
                     <motion.h1 className="text-8xl md:text-9xl font-serif italic text-[#F5F1E1] uppercase tracking-[0.5em] ml-[0.5em] leading-none font-light h-24 md:h-32 drop-shadow-[0_0_30px_rgba(245,241,225,0.15)]">
                         {displayText}
                     </motion.h1>
                     
                     <div className="flex flex-col items-center gap-6 mt-12">
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 0.2, scaleX: 1 }}
                            transition={{ delay: 2, duration: 2 }}
                            className="h-[0.5px] w-64 bg-amber-200/30"
                        />
                        <motion.p
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 0.5, y: 0 }}
                             transition={{ delay: 2.5, duration: 1.2 }}
                             className="text-[11px] uppercase tracking-[1.5em] text-[#F5F1E1] font-light italic"
                         >
                             The Art of the Moment
                         </motion.p>
                     </div>
                  </div>
              </div>

              {/* CUSTOM CURSOR */}
              <motion.div 
                style={{ x: springX, y: springY }}
                className="fixed top-0 left-0 w-12 h-12 z-[1000] pointer-events-none -translate-x-1/2 -translate-y-1/2"
              >
                 <div className="w-full h-full border border-amber-500/20 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                 </div>
              </motion.div>
            </>
          )}

          {/* CINEMATIC EXIT FLASH (Camera Shutter Effect) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ 
              opacity: [0, 1, 0.8, 1, 0],
              transition: { 
                duration: 0.8, 
                times: [0, 0.1, 0.2, 0.3, 1],
                ease: "easeInOut"
              }
            }}
            className="fixed inset-0 bg-white z-[10000] pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
