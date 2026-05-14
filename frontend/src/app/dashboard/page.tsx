"use client";

import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/ui/StatsCard";
import { PageLoader } from "@/components/ui/Loader";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Image, Users, Plus, ArrowRight, Camera, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = () => {
    api.folders.list().then(setFolders).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete the collection "${folderName}"? This will permanently remove all sub-events and photos.`)) {
      try {
        await api.folders.delete(folderId);
        fetchFolders();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete folder.");
      }
    }
  };

  if (authLoading || !user) return <PageLoader />;

  const totalPhotos = folders.reduce((sum, f) => sum + (f.totalPhotos || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-8 lg:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <h1 className="text-5xl md:text-6xl font-serif-aesthetic italic text-[#4A443A] mb-4">
                Hello, {user.name.split(' ')[0]}
              </h1>
              <p className="text-lg text-[#827A6E] font-light">
                Welcome back to your client collections.
              </p>
            </div>
            <Link
              href="/folders/create"
              className="flex items-center gap-3 px-8 py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
              style={{ background: "#1A1A1A" }}
            >
              <Plus className="w-4 h-4" /> Create Collection
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <StatsCard title="Total Collections" value={folders.length} icon={Calendar} color="#6B8BA4" />
            <StatsCard title="Total Photos" value={totalPhotos} icon={Image} color="#D2A078" />
            <StatsCard title="Active Clients" value={folders.length} icon={Users} color="#D97A62" />
            <StatsCard title="Face Searches" value="Unlimited" icon={Camera} color="#4A443A" />
          </div>

          {/* Collections Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-serif-aesthetic italic text-[#4A443A]">Your Client Folders</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-[2.5rem] bg-white border border-[#E8E2D6] animate-pulse" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 rounded-[3rem] border border-dashed border-[#E8E2D6] bg-white/50"
            >
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Calendar className="w-8 h-8 text-[#D2A078]" />
              </div>
              <h3 className="text-2xl font-medium text-[#4A443A] mb-4">No collections yet</h3>
              <p className="text-[#827A6E] mb-10 max-w-xs mx-auto font-light">
                Create your first client folder to start organizing sub-events and photos.
              </p>
              <Link
                href="/folders/create"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-[#4A443A] border border-[#4A443A] transition-all hover:bg-[#4A443A] hover:text-white"
              >
                <Plus className="w-4 h-4" /> Create Collection
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {folders.map((folder, i) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/folders/${folder.id}`}
                    className="block rounded-[2.5rem] bg-white border border-[#E8E2D6] overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-2 group"
                  >
                    {/* Cover Image */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-[#F5F1E1]">
                      {folder.coverUrl ? (
                        <img 
                          src={folder.coverUrl} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-[#D2A078]" />
                        </div>
                      )}
                      <div className="absolute top-6 right-6 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md text-[#4A443A]">
                        {folder.totalPhotos} photos
                      </div>
                      {folder.isPaid && (
                        <div className="absolute top-6 left-6 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/80 backdrop-blur-md text-white">
                          ₹{folder.price}
                        </div>
                      )}
                    </div>
                    {/* Folder Info */}
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-medium text-[#4A443A] truncate">
                          {folder.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleDelete(e, folder.id, folder.name)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group/del"
                            title="Delete Collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ArrowRight className="w-5 h-5 text-[#D2A078] transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] mb-2">
                        {new Date(folder.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-[#827A6E]">
                        {folder.eventCount} Sub-events
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
