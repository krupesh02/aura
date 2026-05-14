"use client";

import { motion } from "framer-motion";
import { Download, Eye, Trash2, Loader2, Maximize2 } from "lucide-react";
import { useState } from "react";

interface Props {
  url: string;
  thumbnailUrl?: string;
  id?: string;
  onView?: () => void;
  onDelete?: () => void;
  similarity?: number;
}

export function ImageCard({ url, thumbnailUrl, id, onView, onDelete, similarity }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (downloading) return;
    
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const filename = url.split("/").pop()?.split("?")[0] || "photo.jpg";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-[2.5rem] overflow-hidden cursor-pointer bg-white mb-6"
      style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)" }}
      onClick={onView}
    >
      <img
        src={thumbnailUrl || url}
        alt=""
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ minHeight: "120px" }}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex flex-col justify-between p-6">
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {similarity !== undefined && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                    {Math.round(similarity * 100)}% match
                </span>
            )}
        </div>
        
        <div className="flex items-center justify-between translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
            <Maximize2 className="w-4 h-4" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform disabled:opacity-50 shadow-lg"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-3 rounded-full bg-red-500 text-white hover:scale-110 transition-transform shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

