"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ImageCard } from "@/components/ui/ImageCard";
import { ModalViewer } from "@/components/ui/ModalViewer";
import { PageLoader, GridSkeleton } from "@/components/ui/Loader";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Filter, ChevronDown } from "lucide-react";

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      api.events.list().then(setEvents).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const loadPhotos = async () => {
      const eventsToLoad = selectedEvent === "all" ? events : events.filter((e) => e.id === selectedEvent);
      const allPhotos: any[] = [];
      for (const ev of eventsToLoad) {
        try {
          const res = await api.photos.listByEvent(ev.id, 1, 500);
          allPhotos.push(...(res.photos || []));
        } catch {}
      }
      // Sort by date desc
      allPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPhotos(allPhotos);
      setLoading(false);
    };

    if (events.length > 0) loadPhotos();
    else if (events.length === 0 && !loading) setLoading(false);
  }, [user, events, selectedEvent]);

  if (authLoading || !user) return <PageLoader />;

  return (
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-8 lg:p-12">
          {/* Gallery Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-serif-aesthetic italic text-[#4A443A] mb-2">Gallery</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#827A6E]">
                {photos.length} moments captured
              </p>
            </div>

            <div className="relative group">
                <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="appearance-none pl-10 pr-12 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white border border-[#E8E2D6] text-[#4A443A] outline-none transition-all hover:border-[#D2A078] cursor-pointer shadow-sm"
                >
                    <option value="all">All Events</option>
                    {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.name}
                        </option>
                    ))}
                </select>
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D2A078]" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#827A6E]" />
            </div>
          </div>

          {loading ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-full aspect-[3/4] bg-white border border-[#E8E2D6] rounded-[2.5rem] animate-pulse" />
                ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-40 rounded-[3rem] border border-dashed border-[#E8E2D6] bg-white/50">
              <p className="text-sm font-light text-[#827A6E]">
                No moments found in this collection.
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {photos.map((photo, i) => (
                <ImageCard
                  key={photo.id}
                  url={photo.url}
                  thumbnailUrl={photo.thumbnailUrl}
                  onView={() => setViewerIdx(i)}
                />
              ))}
            </div>
          )}

          {viewerIdx !== null && photos[viewerIdx] && (
            <ModalViewer
              url={photos[viewerIdx].url}
              onClose={() => setViewerIdx(null)}
              onPrev={viewerIdx > 0 ? () => setViewerIdx(viewerIdx - 1) : undefined}
              onNext={viewerIdx < photos.length - 1 ? () => setViewerIdx(viewerIdx + 1) : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
}
