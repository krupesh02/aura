"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, SwitchCamera, X, Calendar, Sparkles, Aperture, Upload, Loader2, Download, CheckCircle2, ArrowRight, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/ui/Loader";
import Link from "next/link";
import { ModalViewer } from "@/components/ui/ModalViewer";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="5" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

type Step = "payment" | "instagram" | "whatsapp" | "access_granted" | "gallery";
type Mode = "upload" | "camera";

const anim = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.5, ease: "easeOut" as const } };

export default function GuestFlowPage() {
  const { id } = useParams<{ id: string }>();
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [step, setStep] = useState<Step>("payment");
  const [payProcessing, setPayProcessing] = useState(false);

  // Gallery & Face Scan State
  const [allEventPhotos, setAllEventPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [mode, setMode] = useState<Mode>("camera");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searched, setSearched] = useState(false);

  const [viewerIdx, setViewerIdx] = useState<{ isResult: boolean, idx: number } | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // TEMPORARY: Commented out so you can test the full flow every time without being skipped!
    // if (typeof window !== "undefined" && localStorage.getItem(`guestToken_${id}`)) {
    //   setStep("gallery");
    // }

    api.public.getEvent(id).then(setEventInfo).catch(() => { }).finally(() => setLoadingEvent(false));

    setLoadingPhotos(true);
    api.public.getEventPhotos(id, 1, 100)
      .then(res => setAllEventPhotos(res.photos || []))
      .catch(() => { })
      .finally(() => setLoadingPhotos(false));
  }, [id]);

  // ==================== CAMERA LOGIC ====================
  const startCamera = useCallback(async () => {
    if (step !== "gallery" || mode !== "camera") return;
    setCameraError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setCameraActive(true);
    } catch { setCameraError("Camera access denied."); setCameraActive(false); }
  }, [facingMode, step, mode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d"); if (!ctx) return;
    if (facingMode === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0);
    c.toBlob(b => { if (!b) return; const file = new File([b], "capture.jpg", { type: "image/jpeg" }); setSelfie(file); setSelfiePreview(URL.createObjectURL(b)); stopCamera(); handleSearch(file); }, "image/jpeg", 0.95);
  }, [facingMode, stopCamera]);

  useEffect(() => { if (cameraActive && step === "gallery" && mode === "camera") startCamera(); }, [facingMode]);
  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => { if (step === "gallery" && mode === "camera" && !selfiePreview) startCamera(); else stopCamera(); }, [step, mode, selfiePreview]);

  const switchCamera = () => { setFacingMode(prev => prev === "user" ? "environment" : "user"); stopCamera(); setTimeout(startCamera, 100); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelfie(f);
      setSelfiePreview(URL.createObjectURL(f));
      handleSearch(f);
    }
  };

  // ==================== FLOW LOGIC ====================
  const handlePay = () => {
    setPayProcessing(true);
    setTimeout(() => { localStorage.setItem(`guestToken_${id}`, `bypass_${Date.now()}`); setPayProcessing(false); setStep("instagram"); }, 1500);
  };

  const handleInstaFollow = () => {
    window.open("https://www.instagram.com/tulsivivah_photography?utm_source=qr&igsh=MWx0dmIyMjlyeWRoaQ==", "_blank");
    setTimeout(() => setStep("whatsapp"), 2000);
  };

  const handleWhatsappJoin = () => {
    window.open("https://wa.me/message/YOUR_WHATSAPP_LINK", "_blank");
    setTimeout(() => setStep("access_granted"), 2000);
  };

  useEffect(() => {
    if (step === "access_granted") {
      const t = setTimeout(() => setStep("gallery"), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ==================== SEARCH & DOWNLOAD ====================
  const handleSearch = async (file: File) => {
    setLoadingSearch(true);
    setSearched(false);
    try {
      const data = await api.public.searchPhotosByFace(file, id);
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleReset = () => { setSelfie(null); setSelfiePreview(null); setSearched(false); setResults([]); if (mode === "camera") startCamera(); };

  const handleDownload = async (photo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(prev => ({ ...prev, [photo.id]: true }));
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { console.error("Download failed:", err); }
    finally { setDownloading(prev => ({ ...prev, [photo.id]: false })); }
  };

  if (loadingEvent) return <PageLoader />;
  if (!eventInfo) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
      <div className="text-center">
        <h1 className="text-3xl font-light mb-4">Event Not Found</h1>
        <Link href="/" className="text-sky-400 hover:text-sky-300 uppercase tracking-widest text-xs font-bold transition-colors">Return Home</Link>
      </div>
    </div>
  );

  // displayPhotos logic removed as we will render both explicitly

  return (
    <div className="min-h-screen text-white font-sans selection:bg-sky-500/30 relative">
      {/* Premium Cinematic Video Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="/event-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      <AnimatePresence mode="wait">

        {/* ==================== PAYMENT STEP ==================== */}
        {step === "payment" && (
          <motion.main key="payment" {...anim} className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-[400px] bg-black/20 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden flex flex-col">
              {/* Minimalist Accents */}
              <div className="absolute top-6 left-10 w-6 h-[1px] bg-sky-400" />
              
              <div className="mt-6 mb-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 mb-4">Exclusive Access</p>
                <h1 className="text-5xl font-light tracking-tighter text-white leading-none mb-4">
                  {eventInfo.name.split(' ').map((word: string, i: number) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h1>
                <p className="text-white/30 text-xs font-light leading-relaxed max-w-[200px]">
                  Unlock the full digital collection preserved by Aura.
                </p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-end border-b border-white/5 pb-5">
                  <div className="space-y-1">
                    <span className="block text-white/80 text-base font-medium">Digital Pass</span>
                    <span className="block text-[9px] text-white/20 uppercase tracking-widest font-black">Full Gallery & AI Search</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-light tracking-tighter text-white">₹99</span>
                    <span className="block text-[7px] text-sky-400 font-black uppercase tracking-widest mt-1">VAT Included</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={handlePay} 
                  disabled={payProcessing} 
                  className="w-full py-5 bg-sky-400 text-white rounded-full font-black uppercase tracking-[0.3em] text-[9px] transition-all hover:bg-sky-300 active:scale-95 shadow-[0_15px_30px_rgba(56,189,248,0.15)] flex justify-center items-center gap-3"
                >
                  {payProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Unlock Gallery</>
                  )}
                </button>
                
                <div className="flex justify-center">
                  <div className="flex items-center gap-3 text-white/10">
                    <div className="w-8 h-[1px] bg-white/5" />
                    <Aperture className="w-3 h-3" />
                    <div className="w-8 h-[1px] bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.main>
        )}

        {/* ==================== INSTAGRAM STEP ==================== */}
        {step === "instagram" && (
          <motion.main key="instagram" {...anim} className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <InstagramIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Step 1 of 2</h2>
              <h3 className="text-3xl font-medium tracking-tight mb-4">Follow Us</h3>
              <p className="text-white/40 text-sm font-light mb-10 leading-relaxed">Follow our Instagram page to continue unlocking your premium gallery memories.</p>
              <button onClick={handleInstaFollow} className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(236,72,153,0.3)] flex justify-center items-center gap-3">
                Follow @tulsivivah <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.main>
        )}

        {/* ==================== WHATSAPP STEP ==================== */}
        {step === "whatsapp" && (
          <motion.main key="whatsapp" {...anim} className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500" />
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Final Step</h2>
              <h3 className="text-3xl font-medium tracking-tight mb-4">Join Community</h3>
              <p className="text-white/40 text-sm font-light mb-10 leading-relaxed">Join our exclusive WhatsApp community for instant updates and priority memory access.</p>
              <button onClick={handleWhatsappJoin} className="w-full py-5 bg-emerald-600 text-white rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(16,185,129,0.3)] flex justify-center items-center gap-3">
                Join WhatsApp <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.main>
        )}

        {/* ==================== ACCESS GRANTED STEP ==================== */}
        {step === "access_granted" && (
          <motion.main key="access_granted" {...anim} className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <h2 className="text-3xl font-light mb-2">Access Granted</h2>
              <p className="text-white/40">Loading your gallery...</p>
            </div>
          </motion.main>
        )}

        {/* ==================== GALLERY & FACE SCAN STEP ==================== */}
        {step === "gallery" && (
          <motion.main key="gallery" {...anim} className="min-h-screen flex flex-col pt-10">
            {/* Minimal Header */}
            <header className="px-6 md:px-10 flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-light tracking-tight">{eventInfo.name}</h1>
                <div className="flex items-center gap-4 text-white/40 text-xs mt-2 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-sky-400" /> {new Date(eventInfo.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-sky-400" /> {allEventPhotos.length} Shots</span>
                </div>
              </div>
              <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </Link>
            </header>

            {/* TOP: Face Scan Interface - Matching New Design */}
            <section className="px-6 pb-12 pt-8 flex justify-center">
              <div className="w-full max-w-lg bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-center">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-12 h-12 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                  </div>
                  <h2 className="text-3xl font-medium tracking-tight mb-2">Find Your Photos</h2>
                  <p className="text-white/40 text-xs font-light leading-relaxed">Scan your face to instantly filter the gallery memories below.</p>
                </div>

                <div className="flex flex-col items-center gap-8">
                  <AnimatePresence mode="wait">
                    {selfiePreview ? (
                      <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-6">
                        <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-sky-400/40 p-1 shadow-2xl">
                          <img src={selfiePreview} alt="Selfie" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <button onClick={handleReset} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="camera" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-8">
                        <div className="relative">
                          <div className={`w-48 h-48 rounded-full overflow-hidden border-2 relative transition-all duration-500 ${cameraActive ? "border-sky-400/50 shadow-[0_0_40px_rgba(56,189,248,0.15)]" : "border-white/5"}`}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                          {cameraActive && <div className="absolute inset-[-10px] rounded-full border border-sky-400/20 animate-pulse pointer-events-none" />}
                        </div>

                        <div className="flex items-center gap-4">
                          <button onClick={switchCamera} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <SwitchCamera className="w-4 h-4 text-white/60" />
                          </button>
                          {cameraActive ? (
                            <button onClick={capturePhoto} className="px-10 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                              <Camera className="w-4 h-4" /> Capture Scan
                            </button>
                          ) : (
                            <button onClick={() => { setMode("camera"); startCamera(); }} className="px-10 py-4 bg-sky-400 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(56,189,248,0.3)]">
                              <Camera className="w-4 h-4" /> Start Camera
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            {/* BOTTOM: Gallery Grid */}
            <section className="flex-grow px-6 md:px-10 pb-20 bg-black/40 backdrop-blur-3xl border-t border-white/5 pt-16 rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              {/* MATCHED PHOTOS */}
              {searched && (
                <div className="mb-24">
                  <div className="flex items-center justify-between mb-10 max-w-7xl mx-auto px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-[#38BDF8]">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="text-2xl font-medium tracking-tight">Matched Moments</h3>
                      </div>
                      <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-black">AI Precision Matching</p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-black uppercase tracking-widest">
                      {results.length} Matches Found
                    </div>
                  </div>

                  {results.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-white/[0.05] border-dashed max-w-7xl mx-auto">
                      <p className="text-white/40 font-light text-sm italic">No matches found in this gallery yet. Try another scan!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                      {results.map((r: any, i: number) => {
                        const photo = r.photo;
                        return (
                          <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl"
                            onClick={() => setViewerIdx({ isResult: true, idx: i })}
                          >
                            <img src={photo.thumbnailUrl || photo.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-[#38BDF8]/30 text-[10px] font-black text-[#38BDF8] shadow-xl">
                              {(r.similarity * 100).toFixed(0)}% MATCH
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                              <button
                                onClick={(e) => handleDownload(photo, e)}
                                disabled={downloading[photo.id]}
                                className="w-full py-3.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                              >
                                {downloading[photo.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Save Memory</>}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ALL EVENT PHOTOS */}
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-10 px-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-medium tracking-tight text-white/90">Event Collection</h3>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] font-black">Full Gallery Access</p>
                  </div>
                  <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                    {allEventPhotos.length} Total Shots
                  </div>
                </div>

                {allEventPhotos.length === 0 ? (
                  <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/[0.05] border-dashed">
                    <p className="text-white/40 font-light italic">The event gallery is being preserved. Check back soon.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {allEventPhotos.map((photo: any, i: number) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors shadow-xl"
                        onClick={() => setViewerIdx({ isResult: false, idx: i })}
                      >
                        <img src={photo.thumbnailUrl || photo.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                          <button
                            onClick={(e) => handleDownload(photo, e)}
                            disabled={downloading[photo.id]}
                            className="w-full py-3.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                          >
                            {downloading[photo.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Save Memory</>}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Modal Viewer */}
            {viewerIdx !== null && (
              <ModalViewer
                url={viewerIdx.isResult ? results[viewerIdx.idx].photo.url : allEventPhotos[viewerIdx.idx].url}
                onClose={() => setViewerIdx(null)}
                onPrev={viewerIdx.idx > 0 ? () => setViewerIdx({ isResult: viewerIdx.isResult, idx: viewerIdx.idx - 1 }) : undefined}
                onNext={viewerIdx.idx < (viewerIdx.isResult ? results.length : allEventPhotos.length) - 1 ? () => setViewerIdx({ isResult: viewerIdx.isResult, idx: viewerIdx.idx + 1 }) : undefined}
              />
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
