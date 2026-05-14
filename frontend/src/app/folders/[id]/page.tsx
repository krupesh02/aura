"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageLoader } from "@/components/ui/Loader";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Calendar, Image as ImageIcon, Share2, Check, ArrowLeft, Plus, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [folder, setFolder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Create event form state
  const [showCreate, setShowCreate] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const fol = await api.folders.get(id);
      setFolder(fol);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the collection "${folder.name}"? This action cannot be undone.`)) {
      try {
        await api.folders.delete(id);
        toast("Collection deleted successfully", "success");
        router.push("/dashboard");
      } catch (err) {
        toast("Failed to delete collection", "error");
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!folder) return <div className="p-8 text-center">Collection not found</div>;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName) return;
    setCreating(true);
    try {
      await api.events.create({
        clientFolderId: id,
        name: eventName,
        description: eventDesc
      });
      setEventName("");
      setEventDesc("");
      setShowCreate(false);
      toast("Sub-event created!", "success");
      loadData();
    } catch (err: any) {
      toast("Failed to create event", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/folders/${id}/find`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>
      <Navbar />
      


      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-8 lg:p-12">
          {/* Header */}
          <div className="mb-16">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-[#827A6E] mb-8 hover:text-[#4A443A] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Collections
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-serif-aesthetic italic text-[#4A443A] mb-4">
                  {folder.name}
                </h1>
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D2A078]">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(folder.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {folder.totalPhotos} total photos
                  </span>
                  {folder.isPaid && (
                    <span className="flex items-center gap-2 bg-[#D2A078]/10 text-[#D2A078] px-3 py-1 rounded-full">
                      Paid: ₹{folder.price}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${
                    copied 
                      ? "bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]" 
                      : "bg-white text-[#4A443A] border-[#E8E2D6] hover:border-[#D2A078]"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? "Link Copied" : "Share Client Link"}
                </button>
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-105 shadow-lg"
                  style={{ background: "#4A443A" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Sub-Event
                </button>
                <button
                  onClick={handleDelete}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2D6] text-red-400 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                  title="Delete Collection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Create Sub-event Form */}
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
              <div className="p-8 rounded-[2.5rem] bg-white border border-[#E8E2D6] max-w-2xl">
                <h3 className="text-xl font-medium text-[#4A443A] mb-6">Create New Sub-Event</h3>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4 mb-2">Event Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Haldi, Sangeet" 
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] ml-4 mb-2">Description (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Brief details" 
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E8E2D6] rounded-2xl text-[#4A443A] placeholder-[#C4BCB3] focus:outline-none focus:border-[#D2A078] focus:ring-1 focus:ring-[#D2A078] transition-all"
                    />
                  </div>
                  <div className="flex justify-end gap-4 mt-4">
                    <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 text-sm text-[#827A6E] hover:text-[#4A443A]">Cancel</button>
                    <button disabled={creating} type="submit" className="px-8 py-3 rounded-xl bg-[#4A443A] text-white text-sm font-bold tracking-wider hover:bg-[#1A1A1A] transition-colors disabled:opacity-50">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Sub-events List */}
          <div className="mb-8">
            <h2 className="text-2xl font-serif-aesthetic italic text-[#4A443A]">Sub-Events</h2>
          </div>

          {folder.events && folder.events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folder.events.filter((e:any) => e.status !== "DELETED").map((event: any, i: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-[2rem] bg-white border border-[#E8E2D6] p-8 transition-all hover:shadow-xl hover:-translate-y-1 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#F5F1E1] flex items-center justify-center text-[#D2A078] group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#C4BCB3] group-hover:text-[#D2A078] group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-medium text-[#4A443A] mb-1">{event.name}</h3>
                    <p className="text-sm text-[#827A6E] font-light mb-4 truncate">{event.description || "No description"}</p>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[#827A6E]">
                      <span>{event.photoCount} Photos</span>
                      <span>View Gallery</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="text-center py-20 rounded-[3rem] border border-dashed border-[#E8E2D6] bg-white/50">
              <Calendar className="w-12 h-12 text-[#D2A078] mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-medium text-[#4A443A] mb-2">No Sub-events</h3>
              <p className="text-sm font-light text-[#827A6E]">
                Create sub-events like "Haldi" or "Reception" to organize your photos.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
