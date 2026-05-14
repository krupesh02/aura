"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Aperture } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, name, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 scale-105"
      >
        <source src="/login-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-lg px-6 py-12"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group cursor-pointer">
            <motion.div 
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.5, ease: "anticipate" }}
              className="w-10 h-10 rounded-xl bg-black/80 flex items-center justify-center border border-white/20 shadow-lg"
            >
              <Aperture className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-black uppercase tracking-[0.4em] text-black">Aura</span>
          </Link>
          <h1 className="text-6xl font-serif-aesthetic text-black/80">
            Create <span className="italic text-[#6B8BA4]">account.</span>
          </h1>
          <p className="text-sm mt-4 text-black/60 font-light tracking-wide uppercase tracking-[0.1em]">
            Join the elite network of event photographers
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/40 backdrop-blur-3xl border border-white/40 rounded-[3.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs p-3 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 text-center font-bold uppercase tracking-widest">
                {error}
              </motion.div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-black text-black/40 mb-2 block px-4">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-[#6B8BA4] transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full pl-14 pr-6 py-5 rounded-2xl text-sm bg-white/60 border border-white/50 focus:border-[#6B8BA4] outline-none transition-all shadow-sm placeholder:text-black/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-black text-black/40 mb-2 block px-4">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-[#6B8BA4] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-14 pr-6 py-5 rounded-2xl text-sm bg-white/60 border border-white/50 focus:border-[#6B8BA4] outline-none transition-all shadow-sm placeholder:text-black/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-black text-black/40 mb-2 block px-4">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-[#6B8BA4] transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl text-sm bg-white/60 border border-white/50 focus:border-[#6B8BA4] outline-none transition-all shadow-sm placeholder:text-black/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-3 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] text-white bg-black hover:bg-black/80 transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40">
              Already have an account?{" "}
              <Link href="/login" className="text-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
