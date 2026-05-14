"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Aperture, Menu, X, LogOut, LayoutDashboard, Download, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Only apply dynamic theme on landing page
    if (pathname !== "/") {
      setTheme("light");
      return;
    }

    const sections = document.querySelectorAll("[data-nav-theme]");
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionTheme = entry.target.getAttribute("data-nav-theme") as "dark" | "light";
          if (sectionTheme) setTheme(sectionTheme);
        }
      });
    }, {
      rootMargin: "-80px 0px -90% 0px",
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  const isDarkBg = theme === "dark";
  const navTextColor = isDarkBg ? "text-[#F5F1E1]" : "text-zinc-900";
  const logoBgColor = isDarkBg ? "bg-[#F5F1E1]" : "bg-zinc-900";
  const logoIconColor = isDarkBg ? "text-zinc-900" : "text-[#F5F1E1]";

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 py-7 transition-all duration-500 bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo - only visible on landing page */}
          {pathname === '/' ? (
            <Link href="/" className="flex items-center gap-4 group">
              <motion.div 
                whileHover={{ rotate: 90 }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                  isDarkBg ? "bg-[#F5F1E1]" : "bg-[#4A443A]"
                }`}
              >
                <Aperture className={`w-6 h-6 transition-colors duration-500 ${
                  isDarkBg ? "text-zinc-900" : "text-white"
                }`} />
              </motion.div>
              <span className={`text-[11px] uppercase tracking-[0.4em] font-black transition-colors duration-500 ${
                isDarkBg ? "text-[#F5F1E1]" : "text-[#4A443A]"
              }`}>
                Aura
              </span>
            </Link>
          ) : (
            <div /> // Spacer to keep logout on right
          )}

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-10">
            {user ? (
              <button
                onClick={logout}
                className={`text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-300 px-3 py-2 rounded hover:bg-[#D97A62]/10 flex items-center gap-2 ${
                  isDarkBg ? "text-[#F5F1E1]/60 hover:text-[#F5F1E1]" : "text-[#827A6E] hover:text-[#D97A62]"
                }`}
              >
                Logout <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : pathname === '/' ? (
              <Link 
                href="/login" 
                className={`text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-300 ${
                  isDarkBg ? "text-[#F5F1E1]/60 hover:text-[#F5F1E1]" : "text-[#827A6E] hover:text-[#4A443A]"
                }`}
              >
                Login
              </Link>
            ) : null}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setOpen(!open)}
            className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 hover:bg-white/10 ${navTextColor}`}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-2xl border-b border-white/5 overflow-hidden"
          >
            <div className="flex flex-col p-8 gap-8 items-center text-center">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xs uppercase tracking-[0.3em] font-bold text-white/60 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/search" onClick={() => setOpen(false)} className="text-xs uppercase tracking-[0.3em] font-bold text-white/60 hover:text-white transition-colors">Find Photos</Link>
              {user ? (
                <button onClick={() => { logout(); setOpen(false); }} className="text-xs uppercase tracking-[0.3em] font-bold text-red-400">Logout</button>
              ) : pathname === '/' ? (
                <Link href="/login" onClick={() => setOpen(false)} className="text-xs uppercase tracking-[0.3em] font-bold text-[#F5F1E1]">Login</Link>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
