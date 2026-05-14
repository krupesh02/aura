"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/Loader";
import { ChevronDown, Calendar } from "lucide-react";

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      api.folders.list().then((folders) => {
        const flatEvents: any[] = [];
        folders.forEach((folder) => {
          if (folder.events) {
            folder.events.forEach((ev: any) => {
              if (ev.status !== "DELETED") {
                flatEvents.push({
                  ...ev,
                  displayName: `${folder.name} — ${ev.name}`
                });
              }
            });
          }
        });
        setEvents(flatEvents);
        if (flatEvents.length > 0) setSelectedEvent(flatEvents[0].id);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return <PageLoader />;

  const handleUpload = async (files: File[]) => {
    if (!selectedEvent) return;
    for (const file of files) {
      await api.photos.upload(selectedEvent, file);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#FDFBF7" }}>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-8 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-16 text-center">
              <h1 className="text-5xl font-serif-aesthetic italic text-[#4A443A] mb-4">
                Upload Photos
              </h1>
              <p className="text-lg text-[#827A6E] font-light">
                Select an event and upload your photos. Our AI will automatically detect faces.
              </p>
            </div>

            {/* Event Selector */}
            <div className="mb-12 max-w-md mx-auto">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#827A6E] mb-3 block text-center">
                Select Target Event
              </label>
              <div className="relative">
                <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full appearance-none pl-12 pr-12 py-5 rounded-2xl text-xs font-bold uppercase tracking-widest bg-white border border-[#E8E2D6] text-[#4A443A] outline-none transition-all focus:border-[#D2A078] cursor-pointer shadow-sm"
                >
                    {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                        {ev.displayName}
                    </option>
                    ))}
                </select>
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D2A078]" />
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#827A6E]" />
              </div>
            </div>

            {/* Upload Area */}
            {selectedEvent ? (
              <UploadDropzone onUpload={handleUpload} />
            ) : (
              <div className="text-center py-24 rounded-[3.5rem] border-2 border-dashed border-[#E8E2D6] bg-white/50">
                <p className="text-sm font-light text-[#827A6E]">
                  Please create an event first to start uploading photos.
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
