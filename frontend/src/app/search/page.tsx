"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Upload, Loader2, Sparkles, Camera, SwitchCamera, X, Image as ImageIcon, Aperture, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ModalViewer } from "@/components/ui/ModalViewer";
import { PageLoader } from "@/components/ui/Loader";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";

// Simple Instagram Icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

type Mode = "upload" | "camera";

export default function GlobalSearchPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("camera");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<{ totalMatches: number; folderSummaries: any[]; tempSelfieId: string } | null>(null);
  const [unifiedPhotos, setUnifiedPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<"search" | "summary" | "payment" | "socials" | "results">("search");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestToken, setGuestToken] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("global_access_token");
    if (token) setGuestToken(token);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("Could not access camera.");
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setSelfie(file);
        setSelfiePreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  }, [facingMode, stopCamera]);

  const switchCamera = () => { setFacingMode(prev => prev === "user" ? "environment" : "user"); stopCamera(); setTimeout(startCamera, 100); };
  
  const handleSearch = async () => {
    if (!selfie) return;
    setLoading(true);
    try {
      const data = await api.public.searchEventsByFace(selfie);
      setSearchData(data);
      if (data.totalMatches === 0) {
        setSearchStep("results");
      } else {
        setSearchStep("summary");
      }
    } catch (err: any) {
      console.error("[Search] Error:", err);
      alert(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (token: string) => {
    localStorage.setItem("global_access_token", token);
    setGuestToken(token);
    setSearchStep("socials");
  };

  const handleSocialFollow = async () => {
    window.open("https://www.instagram.com/tulsivivah_photography?utm_source=qr&igsh=MWx0dmIyMjlyeWRoaQ==", "_blank");
    setTimeout(async () => {
        setLoading(true);
        try {
            if (selfie && guestToken) {
                const photos = await api.public.getUnifiedGallery(selfie, guestToken);
                setUnifiedPhotos(photos);
            }
            setSearchStep("results");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, 2000);
  };

  const handleReset = () => { 
    setSelfie(null); 
    setSelfiePreview(null); 
    setSearchStep("search"); 
    setSearchData(null);
    setUnifiedPhotos([]);
    stopCamera(); 
  };

  if (!mounted) return <PageLoader />;

  return (
    <div className={`text-white selection:bg-[#6B8BA4] selection:text-black relative ${searchStep === "results" ? 'min-h-screen overflow-auto' : 'h-screen overflow-hidden'}`}>
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover opacity-80 -z-10">
        <source src="/search-video.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-black/50 -z-10" />

      <main className={`relative z-10 flex flex-col pt-16 pb-6 ${searchStep === "results" ? 'min-h-screen' : 'h-full overflow-hidden'}`}>
        <div className="max-w-7xl mx-auto px-6 w-full flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {searchStep === "search" && (
              <motion.div key="search-box" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-4xl text-center flex flex-col items-center">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#6B8BA4]/20 backdrop-blur-xl border border-[#6B8BA4]/30 flex items-center justify-center mb-4 shadow-2xl">
                    <Aperture className="w-6 h-6 text-[#6B8BA4]" />
                  </div>
                  <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-2">
                    Find Your <span className="font-serif-aesthetic italic text-[#38BDF8]">Photos.</span>
                  </h1>
                  <p className="text-white/60 text-[10px] md:text-xs max-w-md mx-auto leading-relaxed font-light">
                    One scan to find all your moments across <br /> every exclusive event on our platform.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative w-full max-w-lg flex items-center justify-center">
                  <canvas ref={canvasRef} className="hidden" />
                  {!selfiePreview ? (
                    <div className="w-full flex flex-col items-center">
                      {cameraActive ? (
                        <div className="flex flex-col items-center gap-8">
                          <div className="relative w-full max-w-[280px] aspect-square rounded-full overflow-hidden border-2 border-[#38BDF8]/30 shadow-2xl">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
                          </div>
                          <div className="flex items-center gap-6">
                            <button onClick={switchCamera} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all"><SwitchCamera className="w-4 h-4" /></button>
                            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-xl"><Camera className="w-6 h-6" /></button>
                            <button onClick={stopCamera} className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/20"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-56 h-56 rounded-full border border-white/[0.05] flex items-center justify-center">
                          <button onClick={() => { setMode("camera"); startCamera(); }} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95">
                            <Camera className="w-8 h-8 text-black" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 w-full">
                      <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-[#38BDF8]/40 shadow-2xl p-1">
                          <img src={selfiePreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="flex items-center gap-4 w-full max-w-sm">
                        <button onClick={handleReset} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 group"><X className="w-5 h-5 text-white/40 group-hover:text-white" /></button>
                        <button onClick={handleSearch} disabled={loading} className="flex-1 py-4 rounded-full bg-[#38BDF8] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Start Global Scan</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {searchStep === "summary" && searchData && (
              <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                <div className="bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 shadow-2xl flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-light tracking-tighter mb-4">Discovery Success!</h2>
                  <p className="text-white/40 text-sm font-light mb-10">We found <span className="text-white font-medium text-lg tracking-normal">{searchData.totalMatches} matches</span> across {searchData.folderSummaries.length} exclusive collections.</p>
                  
                  <div className="w-full space-y-4 mb-10">
                    {searchData.folderSummaries.slice(0, 3).map((folder: any) => (
                        <div key={folder.id} className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/5 rounded-2xl">
                            <span className="text-[11px] font-medium text-white/80">{folder.name}</span>
                            <span className="text-[10px] text-[#38BDF8] font-black">{folder.matchCount} Photos</span>
                        </div>
                    ))}
                  </div>

                  <button onClick={() => setSearchStep("payment")} className="w-full py-5 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">
                    Unlock All My Photos
                  </button>
                </div>
              </motion.div>
            )}

            {searchStep === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                <div className="bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 shadow-2xl flex flex-col items-center">
                  <Aperture className="w-16 h-16 text-[#38BDF8] mb-8 animate-spin-slow" />
                  <h2 className="text-3xl font-light tracking-tighter mb-4">Complete Access</h2>
                  <p className="text-white/40 text-sm font-light mb-10 leading-relaxed">Pay once to unlock and download all your matching photos across the entire platform.</p>
                  
                  <div className="w-full bg-[#38BDF8]/5 rounded-3xl p-8 mb-10 border border-[#38BDF8]/20 flex items-center justify-between">
                     <div className="text-left">
                        <span className="block text-[10px] uppercase tracking-widest text-[#38BDF8] mb-1 font-black">Global Access Pass</span>
                        <span className="text-sm text-white/60 font-light">Unlimited access to your photos</span>
                     </div>
                     <span className="text-4xl font-serif-aesthetic italic text-white">₹99</span>
                  </div>

                  <div className="w-full space-y-4">
                    <input type="text" placeholder="Your Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-5 text-sm focus:outline-none focus:border-[#38BDF8] transition-all" />
                    <button 
                      onClick={() => handlePaymentSuccess("bypass_token_" + Math.random().toString(36).substring(7))}
                      className="w-full py-5 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all"
                    >
                      Unlock My Photos (Testing Mode)
                    </button>
                    <button onClick={() => setSearchStep("summary")} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}

            {searchStep === "socials" && (
              <motion.div key="socials" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                <div className="bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 shadow-2xl flex flex-col items-center">
                  <InstagramIcon className="w-16 h-16 text-pink-500 mb-8" />
                  <h2 className="text-3xl font-light mb-4">One Last Thing!</h2>
                  <p className="text-white/40 text-sm mb-10 font-light">Follow us on Instagram to view your secure unified gallery.</p>
                  <button onClick={handleSocialFollow} className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.05] transition-all">
                    Follow @tulsivivah_photography
                  </button>
                </div>
              </motion.div>
            )}

            {searchStep === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20">
                  <div>
                    <h2 className="text-6xl md:text-8xl font-serif-aesthetic italic leading-[0.9]">My <span className="text-[#38BDF8]">Moments.</span></h2>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] font-black mt-8">Unified Personal Collection</p>
                  </div>
                  <button onClick={handleReset} className="mt-8 md:mt-0 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black transition-all">
                    <X className="w-4 h-4" /> New Search
                  </button>
                </div>

                {unifiedPhotos.length === 0 ? (
                  <div className="py-32 text-center bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10">
                    <Search className="w-12 h-12 text-white/20 mx-auto mb-8" />
                    <h3 className="text-3xl font-light mb-6 tracking-tight">No moments found yet</h3>
                    <p className="text-white/40 max-w-sm mx-auto font-light leading-relaxed mb-12 text-sm text-center">Try uploading a clearer photo or checking back later as more event memories are being preserved.</p>
                    <button onClick={handleReset} className="px-12 py-5 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">Try Again</button>
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6 pb-20">
                    {unifiedPhotos.map((photo, i) => (
                      <motion.div key={photo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="break-inside-avoid relative group rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 cursor-pointer" onClick={() => setViewerUrl(photo.url)}>
                        <img src={photo.thumbnailUrl || photo.url} alt="Moment" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-end">
                            <span className="text-[9px] uppercase tracking-widest text-[#38BDF8] font-black mb-1">{photo.eventName}</span>
                            <span className="text-[10px] text-white/60 font-light">{photo.folderName}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {viewerUrl && <ModalViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
    </div>
  );
}
