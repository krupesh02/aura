"use client";

import { useCallback, useState } from "react";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
}

export function UploadDropzone({ onUpload, accept = "image/*", multiple = true }: Props) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<{ file: File; status: "pending" | "uploading" | "done" | "error" }[]>([]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (dropped.length) processFiles(dropped);
    },
    []
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) processFiles(selected);
    e.target.value = "";
  };

  const processFiles = async (newFiles: File[]) => {
    const items = newFiles.map((f) => ({ file: f, status: "uploading" as const }));
    setFiles((prev) => [...prev, ...items]);
    try {
      await onUpload(newFiles);
      setFiles((prev) =>
        prev.map((p) =>
          items.some((i) => i.file === p.file) ? { ...p, status: "done" } : p
        )
      );
    } catch {
      setFiles((prev) =>
        prev.map((p) =>
          items.some((i) => i.file === p.file) ? { ...p, status: "error" } : p
        )
      );
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-[2.5rem] border-2 border-dashed p-16 text-center transition-all cursor-pointer group ${
          dragging ? "border-[#D2A078] bg-[#FDFBF7]" : "border-[#E8E2D6] bg-white hover:border-[#D2A078]"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleSelect}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-full bg-[#F5F1E1] flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
          <Upload className="w-6 h-6 text-[#D2A078]" />
        </div>
        <p className="text-xl font-medium text-[#4A443A]">
          Drag & drop photos here
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E] mt-2">
          or click to browse · JPG, PNG, WEBP
        </p>
      </div>

      {/* File List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
            {files.map((item, idx) => (
            <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E8E2D6] shadow-sm"
            >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5F1E1]">
                <img
                    src={URL.createObjectURL(item.file)}
                    alt=""
                    className="w-full h-full object-cover"
                />
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#4A443A] truncate uppercase tracking-widest">
                    {item.file.name}
                </p>
                <p className="text-[10px] text-[#827A6E] uppercase tracking-tighter">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                </div>
                <div className="flex-shrink-0">
                {item.status === "uploading" && <Loader2 className="w-5 h-5 animate-spin text-[#D2A078]" />}
                {item.status === "done" && <CheckCircle className="w-5 h-5 text-[#2E7D32]" />}
                {item.status === "error" && (
                    <button onClick={() => removeFile(idx)}>
                    <X className="w-5 h-5 text-red-500" />
                    </button>
                )}
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
