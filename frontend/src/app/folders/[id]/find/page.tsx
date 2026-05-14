"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, SwitchCamera, X, Calendar, Sparkles, Aperture, 
  Upload, Loader2, Download, CheckCircle2, ArrowRight, 
  Image as ImageIcon, ChevronRight,
  Filter, Layers
} from "lucide-react";
import { api, API_URL } from "@/lib/api";
import { PageLoader } from "@/components/ui/Loader";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";

// Simple Instagram & WhatsApp Icons if Lucide is missing or for better style
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

type Step = "search" | "payment" | "instagram" | "whatsapp" | "gallery" | "thankyou";
type Mode = "upload" | "camera";

const anim = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } };

export default function FolderGuestFlowPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get("from") === "search";
  const urlMatches = searchParams.get("matches");

  const [folder, setFolder] = useState<any>(null);
  const [loadingFolder, setLoadingFolder] = useState(true);

  // Flow State
  const [step, setStep] = useState<Step>("payment");
  const [payProcessing, setPayProcessing] = useState(false);
  const [guestName, setGuestName] = useState("");

  // Gallery & Face Scan State
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [mode, setMode] = useState<Mode>("camera");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false); // New state for modal scan

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already paid
    const token = localStorage.getItem(`folder_access_${id}`);
    
    api.public.getFolder(id).then(f => {
      setFolder(f);
      if (token) {
         setStep("gallery");
      }
    }).catch(() => { }).finally(() => setLoadingFolder(false));

    // Load initial batch of photos
    setLoadingPhotos(true);
    api.public.getFolderPhotos(id, 1, 200)
      .then(res => setAllPhotos(res.photos || []))
      .catch(() => { })
      .finally(() => setLoadingPhotos(false));
  }, [id]);

  // ==================== CAMERA LOGIC ====================
  const startCamera = useCallback(async () => {
    if ((step !== "search" && !isFaceScanning) || mode !== "camera") return;
    setCameraError(null);
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setCameraActive(true);
    } catch { setCameraError("Camera access denied."); setCameraActive(false); }
  }, [facingMode, step, mode, isFaceScanning]);

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
    c.toBlob(b => { 
      if (!b) return; 
      const file = new File([b], "selfie.jpg", { type: "image/jpeg" }); 
      setSelfie(file); 
      setSelfiePreview(URL.createObjectURL(b)); 
      stopCamera(); 
      handleSearch(file); 
    }, "image/jpeg", 0.95);
  }, [facingMode, stopCamera]);

  useEffect(() => { 
    if (cameraActive && (step === "search" || isFaceScanning)) {
      startCamera(); 
    }
  }, [facingMode, step, cameraActive, isFaceScanning, startCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => { 
    if ((step === "search" || isFaceScanning) && mode === "camera" && !selfiePreview) {
      startCamera(); 
    } else {
      stopCamera(); 
    }
  }, [step, isFaceScanning, mode, selfiePreview, startCamera, stopCamera]);

  // ==================== FLOW LOGIC ====================
  const handleSearch = async (file: File) => {
    setLoadingSearch(true);
    try {
      const data = await api.public.searchPhotosByFace(file, id);
      setResults(data);
      setIsFaceScanning(false);
      setFilterActive(true);
    } catch (err) {
      console.error(err);
      alert("Face detection failed. Please try again.");
      setSelfie(null);
      setSelfiePreview(null);
      startCamera();
    } finally {
      setLoadingSearch(false);
    }
  };

  const handlePaymentSuccess = (token: string) => {
    localStorage.setItem(`folder_access_${id}`, token);
    setStep("instagram");
  };

  const handleInstaFollow = () => {
    window.open("https://instagram.com/aura_photography", "_blank");
    setTimeout(() => setStep("whatsapp"), 2000);
  };

  const handleWhatsappJoin = () => {
    window.open("https://wa.me/message/YOUR_LINK", "_blank");
    setTimeout(() => setStep("gallery"), 1500);
  };

  if (loadingFolder) return <PageLoader />;
  if (!folder) return <div className="min-h-screen flex items-center justify-center text-white bg-black">Folder Not Found</div>;

  return (
    <div className="min-h-screen text-white font-sans selection:bg-sky-500/30 relative overflow-hidden">
      {/* Premium Video Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50">
          <source src="/event-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      <AnimatePresence mode="wait">
        


        {/* ==================== STEP 2: PAYMENT ==================== */}
        {step === "payment" && (
          <motion.main key="payment" {...anim} className="h-screen w-full flex items-center justify-center p-6">
            <div className="w-full max-w-[400px] bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#6B8BA4]/20 border border-[#6B8BA4]/30 flex items-center justify-center mb-8 shadow-2xl">
                <Aperture className="w-8 h-8 text-[#6B8BA4]" />
              </div>
              <h2 className="text-3xl font-light tracking-tighter mb-4">Unlock Collection</h2>
              <p className="text-white/40 text-sm font-light mb-10">Get full access to all events and photos in {folder.name}.</p>
              
              <div className="w-full bg-white/5 rounded-2xl p-6 mb-10 border border-white/5">
                <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Access Fee</span>
                <span className="text-4xl font-light tracking-tighter text-white">₹{folder.price || 0}</span>
              </div>

              <div className="w-full space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={guestName} 
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                />
                <RazorpayCheckout 
                  clientFolderId={id}
                  amount={folder.price}
                  guestName={guestName || "Guest"}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </motion.main>
        )}

        {/* ==================== STEP 3: INSTAGRAM ==================== */}
        {step === "instagram" && (
          <motion.main key="instagram" {...anim} className="h-screen w-full flex items-center justify-center p-6">
             <div className="w-full max-w-[400px] bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center">
              <InstagramIcon className="w-16 h-16 mx-auto mb-8 text-pink-500" />
              <h2 className="text-3xl font-light mb-4">Almost There!</h2>
              <p className="text-white/40 text-sm mb-10">Follow us on Instagram to continue to your photos.</p>
              <button onClick={handleInstaFollow} className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">
                Follow @aura_photography
              </button>
            </div>
          </motion.main>
        )}

        {/* ==================== STEP 4: WHATSAPP ==================== */}
        {step === "whatsapp" && (
          <motion.main key="whatsapp" {...anim} className="h-screen w-full flex items-center justify-center p-6">
             <div className="w-full max-w-[400px] bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center">
              <WhatsAppIcon className="w-16 h-16 mx-auto mb-8 text-emerald-500" />
              <h2 className="text-3xl font-light mb-4">Join Community</h2>
              <p className="text-white/40 text-sm mb-10">Join our WhatsApp group for event updates and exclusive offers.</p>
              <button onClick={handleWhatsappJoin} className="w-full py-5 bg-emerald-500 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">
                Join WhatsApp Group
              </button>
            </div>
          </motion.main>
        )}

        {/* ==================== STEP 5: MAIN GALLERY DASHBOARD ==================== */}
        {step === "gallery" && (
          <motion.main key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full pb-20">
            {/* Gallery Header */}
            <header className="pt-20 px-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 max-w-7xl mx-auto">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-[1px] bg-sky-400" />
                  <span className="text-[10px] uppercase tracking-[0.5em] font-black text-sky-400">Official Collection</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-4">{folder.name}</h1>
                <p className="text-white/40 text-sm max-w-md font-light leading-relaxed">{folder.description || "Every moment, perfectly captured and preserved."}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {filterActive && (
                  <button 
                    onClick={() => setFilterActive(false)}
                    className="flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    <X className="w-4 h-4" /> Clear Filter
                  </button>
                )}
                
                <button 
                  onClick={() => setIsFaceScanning(true)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    filterActive 
                      ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20 hover:bg-[#38BDF8]/20" 
                      : "bg-[#38BDF8] text-white border-[#38BDF8] shadow-[0_0_30px_rgba(56,189,248,0.3)]"
                  }`}
                >
                  <Camera className="w-4 h-4" /> {filterActive ? "Scan Again" : "Find My Photos"}
                </button>

                {filterActive && results.length > 0 && (
                  <button 
                    onClick={() => alert("Starting ZIP download for " + results.length + " photos...")}
                    className="flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download All ({results.length})
                  </button>
                )}
              </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 space-y-20">
              
              {/* Sub-Events Section */}
              {!filterActive && folder.events && folder.events.length > 0 && (
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <Layers className="w-4 h-4 text-white/40" />
                    <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-white/40">Sub-Events</h2>
                  </div>
                  <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                    {folder.events.map((ev: any) => (
                      <div key={ev.id} className="min-w-[280px] group cursor-pointer">
                        <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10 relative mb-4">
                          <img 
                            src={ev.coverUrl || "/hero-bg.png"} 
                            onError={(e: any) => {
                              if (ev.coverUrl && !e.target.src.includes('/api/photos/')) {
                                // Try proxying if direct link fails
                                const id = ev.coverUrl.split('/').pop()?.split('=')[0];
                                if (id) e.target.src = `${API_URL}/api/photos/${id}/download`;
                              } else {
                                e.target.src = "/hero-bg.png";
                              }
                            }}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <ArrowRight className="w-6 h-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                        <h3 className="text-lg font-medium mb-1">{ev.name}</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                          {(ev.photoCount !== undefined ? ev.photoCount : ev.photo_count) || 0} Photos
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Photos Grid */}
              <section>
                {/* Photos Grid Header / Results Summary */}
                <div className="mb-10">
                  {filterActive ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-[1px] bg-sky-400" />
                        <span className="text-[10px] uppercase tracking-[0.5em] font-black text-sky-400">Search Results</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-serif-aesthetic italic leading-tight mb-4">
                        We found <span className="text-sky-400">{results.length}</span> <br />
                        matching moments.
                      </h2>
                      <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">
                        Filtered across all sub-events
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <ImageIcon className="w-4 h-4 text-white/40" />
                      <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-white/40">
                        Complete Collection
                      </h2>
                    </div>
                  )}
                </div>

                {loadingPhotos ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-white/5 animate-pulse" />)}
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {(filterActive ? results : allPhotos).map((photoData: any, i: number) => {
                      const photo = filterActive ? photoData.photo : photoData;
                      if (!photo) return null;
                      return (
                        <motion.div 
                          key={photo.id} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.02 }}
                          className="break-inside-avoid relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10"
                        >
                          <img 
                            src={photo.thumbnailUrl || photo.thumbnail_url || photo.url} 
                            alt="Moment"
                            onError={(e: any) => {
                              // If it's a drive link and it fails, try the proxy
                              if (!e.target.src.includes('/api/photos/')) {
                                e.target.src = `${API_URL}/api/photos/${photo.id}/download`;
                              }
                            }}
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
                            loading="lazy" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                            <div className="flex items-center justify-between">
                              {filterActive && (
                                <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Match {Math.round(photoData.similarity * 100)}%</span>
                              )}
                              <a href={photo.url} download className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Satisfaction Banner / Footer */}
            <footer className="mt-40 border-t border-white/5 py-20 text-center">
              <div className="max-w-lg mx-auto px-6">
                <Aperture className="w-12 h-12 text-sky-400 mx-auto mb-8 animate-spin-slow" />
                <h2 className="text-4xl font-light mb-4">Cherish Every Moment</h2>
                <p className="text-white/40 font-light leading-relaxed mb-10">We hope you loved your collection. Every photo is a piece of your story preserved with Aura.</p>
                <button onClick={() => setStep("thankyou")} className="text-[10px] font-black uppercase tracking-[0.5em] text-sky-400 hover:text-white transition-colors">Finish Session</button>
              </div>
            </footer>
          </motion.main>
        )}

        {/* ==================== STEP 6: THANK YOU ==================== */}
        {step === "thankyou" && (
          <motion.main key="thankyou" {...anim} className="h-screen w-full flex items-center justify-center p-6">
             <div className="w-full max-w-[500px] text-center">
              <div className="w-24 h-24 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(56,189,248,0.2)]">
                <CheckCircle2 className="w-12 h-12 text-sky-400" />
              </div>
              <h1 className="text-6xl font-light tracking-tighter mb-6 italic">Thank You</h1>
              <p className="text-white/40 text-lg font-light leading-relaxed mb-12">Your collection is now fully available. You can return to this link anytime to view your memories.</p>
              <Link href="/" className="px-12 py-5 bg-white text-black rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-105 transition-all">
                Back to Home
              </Link>
            </div>
          </motion.main>
        )}

      </AnimatePresence>

      {/* ==================== FACE SCAN MODAL ==================== */}
      <AnimatePresence>
        {isFaceScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl relative flex flex-col items-center text-center">
              <button onClick={() => { setIsFaceScanning(false); stopCamera(); }} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-[#38BDF8]/20 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-[#38BDF8]" />
              </div>
              <p className="text-white/40 text-sm mb-8">Take a selfie to filter the gallery.</p>
              <canvas ref={canvasRef} className="hidden" />

              {loadingSearch ? (
                 <div className="flex flex-col items-center py-10">
                    <Loader2 className="w-10 h-10 text-[#38BDF8] animate-spin mb-4" />
                    <p className="text-white/60 font-medium tracking-widest text-[10px] uppercase">Scanning Photos...</p>
                 </div>
              ) : mode === "camera" ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[240px] aspect-square rounded-full overflow-hidden border-2 border-[#38BDF8]/30 mb-8">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
                  </div>
                  <button onClick={capturePhoto} className="px-8 py-4 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.3em]">
                    Scan Face
                  </button>
                </div>
              ) : (
                <label className="block w-full cursor-pointer group mb-8">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setSelfie(f); setSelfiePreview(URL.createObjectURL(f)); handleSearch(f); }
                  }} />
                  <div className="w-full h-[240px] rounded-full border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group-hover:border-[#38BDF8]/50 bg-white/5 aspect-square max-w-[240px] mx-auto">
                    <Upload className="w-8 h-8 text-white/40 group-hover:text-[#38BDF8]" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-white/40 group-hover:text-white">Upload Selfie</span>
                  </div>
                </label>
              )}

              {!loadingSearch && mode === "camera" && (
                <div className="flex items-center gap-6 mt-6">
                  <button onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")} className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">
                    Flip Camera
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
