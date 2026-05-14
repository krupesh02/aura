"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ImageCard } from "@/components/ui/ImageCard";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { ModalViewer } from "@/components/ui/ModalViewer";
import { PageLoader, GridSkeleton } from "@/components/ui/Loader";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Calendar, Image, Upload, Share2, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const [ev, ph] = await Promise.all([
        api.events.get(id),
        api.photos.listByEvent(id, 1, 500),
      ]);
      setEvent(ev);
      setPhotos(ph.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, id]);

  if (loading) return <PageLoader />;
  if (!event) return <div className="p-8 text-center">Event not found</div>;

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      await api.photos.upload(id, file);
    }
    loadData();
  };

  const handleDelete = async (photoId: string) => {
    await api.photos.delete(photoId);
    loadData();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/event/${id}/find`;
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
              href={`/folders/${event.clientFolderId}`} 
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-[#827A6E] mb-8 hover:text-[#4A443A] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Collection
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-serif-aesthetic italic text-[#4A443A] mb-4">
                  {event.name}
                </h1>
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D2A078]">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5" />
                    {photos.length} photos
                  </span>
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
                  {copied ? "Link Copied" : "Share Gallery"}
                </button>
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:scale-105 shadow-lg"
                  style={{ background: "#4A443A" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Add Photos
                </button>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
              <UploadDropzone onUpload={handleUpload} />
            </motion.div>
          )}

          {/* Photos Masonry */}
          {photos.length === 0 ? (
            <div className="text-center py-40 rounded-[3rem] border border-dashed border-[#E8E2D6] bg-white/50">
              <Image className="w-12 h-12 text-[#D2A078] mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-medium text-[#4A443A] mb-2">Empty Gallery</h3>
              <p className="text-sm font-light text-[#827A6E]">
                Start your collection by uploading some photos.
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {photos.map((photo, i) => (
                <ImageCard
                  key={photo.id}
                  url={photo.url}
                  thumbnailUrl={photo.thumbnailUrl}
                  id={photo.id}
                  onView={() => setViewerIdx(i)}
                  onDelete={() => handleDelete(photo.id)}
                />
              ))}
            </div>
          )}

          {/* Lightbox */}
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
