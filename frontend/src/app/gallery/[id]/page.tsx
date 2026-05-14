"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ImageIcon, Download, ArrowLeft, Share2, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PageLoader, GridSkeleton } from "@/components/ui/Loader";
import { ModalViewer } from "@/components/ui/ModalViewer";

export default function GuestGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const face = searchParams.get("face");
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        // Load event info
        const eventData = await api.public.getEvent(id);
        setEvent(eventData);

        // If we have a face, search specifically for that face in this event
        if (face) {
          // Note: In a real scenario, we might need to convert the blob URL back to a file or 
          // use a cached result. For now, we'll try to fetch the photos for this event.
          // The backend search already filtered these, so we'll fetch all matching photos.
          
          // Re-running search for this specific event with the same face
          const blob = await fetch(face).then(r => r.blob());
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          const results = await api.public.searchEventsByFace(file);
          const thisEventMatch = results.find((r: any) => r.event.id === id);
          
          if (thisEventMatch) {
            // Fetch the full details of these photos if needed, 
            // but for now we use samplePhotos as the results
            setPhotos(thisEventMatch.samplePhotos || []);
          } else {
            // Fallback to all photos if no match found (unlikely)
            const res = await api.public.getEventPhotos(id, 1, 100);
            setPhotos(res.photos || []);
          }
        } else {
          // Standard view (all photos)
          const res = await api.public.getEventPhotos(id, 1, 100);
          setPhotos(res.photos || []);
        }
      } catch (err) {
        console.error("Gallery load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadGallery();
  }, [id, face]);

  const handleDownload = async (photo: any) => {
    setDownloading(prev => ({ ...prev, [photo.id]: true }));
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(prev => ({ ...prev, [photo.id]: false }));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-sky-500/30">
      <Navbar />
      
      {/* ========== HEADER SECTION ========== */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-[2/1] bg-sky-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <motion.button
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Back to Search</span>
          </motion.button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                  Event Gallery
                </span>
                {face && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> AI Matched
                  </span>
                )}
              </div>
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 leading-none">
                {event?.name || "Event Gallery"}
              </h1>
              <div className="flex items-center gap-6 text-white/40">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-light">
                    {event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "Date TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-light">{photos.length} {face ? "Matched" : "Total"} Photos</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <button className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all">
                <Share2 className="w-4 h-4" /> Share Gallery
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== PHOTO GRID ========== */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          {photos.length === 0 ? (
            <div className="text-center py-40 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
              <p className="text-white/20 text-lg font-light">No photos available for this event yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt=""
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                    onClick={() => setViewerIdx(i)}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                    <div className="flex items-center justify-between">
                      {photo.similarity && (
                        <div className="px-2 py-1 bg-sky-500 rounded text-[8px] font-bold uppercase tracking-tighter">
                          {Math.round(photo.similarity * 100)}% Match
                        </div>
                      )}
                      <button
                        onClick={() => handleDownload(photo)}
                        disabled={downloading[photo.id]}
                        className="w-10 h-10 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        {downloading[photo.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== MODAL VIEWER ========== */}
      <AnimatePresence>
        {viewerIdx !== null && photos[viewerIdx] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center"
          >
            <button 
              onClick={() => setViewerIdx(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-[110]"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-10 z-[110] pointer-events-none">
              <button 
                onClick={() => setViewerIdx(prev => prev! > 0 ? prev! - 1 : prev)}
                className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all pointer-events-auto ${viewerIdx === 0 ? 'opacity-20 pointer-events-none' : ''}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setViewerIdx(prev => prev! < photos.length - 1 ? prev! + 1 : prev)}
                className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all pointer-events-auto ${viewerIdx === photos.length - 1 ? 'opacity-20 pointer-events-none' : ''}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <motion.div 
              key={viewerIdx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center"
            >
              <img 
                src={photos[viewerIdx].url} 
                alt="" 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button 
                  onClick={() => handleDownload(photos[viewerIdx])}
                  className="px-8 py-4 bg-white text-zinc-900 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl"
                >
                  <Download className="w-4 h-4" /> Download High Res
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
