"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Image, Search, Plus, Aperture, Download, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/gallery", label: "Gallery", icon: Image },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-72 h-[calc(100vh-4rem)] sticky top-16 p-6 border-r border-[#E8E2D6]"
      style={{ background: "#FDFBF7" }}
    >
      {/* Centered Logo & Name */}
      <div className="flex flex-col items-center justify-center mb-10 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#4A443A] flex items-center justify-center shadow-lg">
          <Aperture className="w-6 h-6 text-white" />
        </div>
        <span className="text-[12px] uppercase tracking-[0.5em] font-black text-[#4A443A]">
          Aura
        </span>
      </div>

      {/* Create Event Button */}
      <Link
        href="/folders/create"
        className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:shadow-lg mb-8 shadow-[0_10px_20px_-5px_rgba(217,122,98,0.3)]"
        style={{
          background: "linear-gradient(135deg, #6B8BA4 0%, #D97A62 100%)",
        }}
      >
        <Plus className="w-4 h-4" />
        Create Collection
      </Link>

      {/* Nav Links */}
      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${
                active 
                  ? "text-white shadow-md" 
                  : "text-[#827A6E] hover:bg-[#F5F1E1] hover:text-[#4A443A]"
              }`}
              style={
                active
                  ? { background: "linear-gradient(135deg, #6B8BA4 0%, #D97A62 100%)" }
                  : {}
              }
            >
              <link.icon className={`w-4 h-4 ${active ? "text-white" : "text-[#D2A078]"}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Download Desktop App Button */}
      <div className="px-2 mb-6">
        <a
          href="/aura-uploader.exe"
          download
          className="flex flex-col gap-2 p-5 rounded-3xl bg-white border border-[#E8E2D6] hover:border-[#D2A078] transition-all group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F1E1] flex items-center justify-center group-hover:bg-[#D2A078] transition-colors">
              <Download className="w-5 h-5 text-[#D2A078] group-hover:text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4A443A]">Desktop App</p>
              <p className="text-[9px] text-[#827A6E] font-medium">Auto-Sync Engine</p>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-bold text-[#D2A078] uppercase tracking-wider flex items-center gap-1">
            Download for Windows <ArrowRight className="w-3 h-3" />
          </div>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-[#E8E2D6]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F5F1E1]/50 border border-[#E8E2D6]">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Aperture className="w-4 h-4 text-[#4A443A]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A443A]">Aura v2.0</p>
            <p className="text-[8px] text-[#827A6E] uppercase tracking-tighter">AI Powered Platform</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
