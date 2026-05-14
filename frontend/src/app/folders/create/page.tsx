"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { PageLoader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, IndianRupee, Phone } from "lucide-react";
import Link from "next/link";

export default function CreateFolderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    isPaid: false,
    whatsappNo: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (authLoading || !user) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast("Collection name is required.", "error");
      return;
    }

    setLoading(true);
    try {
      const folder = await api.folders.create({
        ...formData,
        price: formData.isPaid ? formData.price : 0,
      });
      router.push(`/folders/${folder.id}`);
    } catch (error: any) {
      toast(error.message || "Failed to create collection", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FDFBF7" }}>
      <Navbar />



      <main className="flex-1 flex flex-col items-center justify-center p-6 mt-16 relative">
        <Link
          href="/dashboard"
          className="absolute top-8 left-8 lg:left-12 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#827A6E] hover:text-[#4A443A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-[#E8E2D6]"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif-aesthetic italic text-[#4A443A] mb-4">
              New Collection
            </h1>
            <p className="text-[#827A6E] font-light max-w-sm mx-auto">
              Create a main folder for your client (e.g., "Rahul & Priya Wedding"). You can add sub-events inside later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4">
                Collection Name
              </label>
              <input
                type="text"
                placeholder="e.g., The Sharma Wedding"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4">
                Description (Optional)
              </label>
              <textarea
                placeholder="Brief details about this shoot..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4">
                WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#827A6E]" />
                <input
                  type="tel"
                  placeholder="For payment notifications"
                  value={formData.whatsappNo}
                  onChange={(e) => setFormData({ ...formData, whatsappNo: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 bg-[#FDFBF7] border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all"
                />
              </div>
              <p className="text-[10px] text-[#827A6E] ml-4 mt-1">We'll send guest payment alerts to this number.</p>
            </div>

            <div className="p-6 rounded-[2rem] border border-[#E8E2D6] bg-[#FDFBF7] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#4A443A] uppercase tracking-widest mb-1">Require Payment</h3>
                  <p className="text-xs text-[#827A6E]">Guests must pay to unlock photos across all sub-events.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-[#E8E2D6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
                </label>
              </div>

              {formData.isPaid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#827A6E]" />
                    <input
                      type="number"
                      min="1"
                      placeholder="999"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full pl-14 pr-6 py-4 bg-white border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all"
                      required={formData.isPaid}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "#1A1A1A" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Collection"}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
