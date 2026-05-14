"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  clientFolderId?: string;
  amount: number;
  guestName: string;
  paymentType?: string;
  onSuccess: (guestToken: string) => void;
}

export function RazorpayCheckout({ clientFolderId, amount, guestName, paymentType = "FOLDER", onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBypass = () => {
    console.log("Bypassing payment...");
    onSuccess("bypass_token_" + Math.random().toString(36).substring(7));
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "dummy_key";
      const isDummy = rzpKey === "dummy_key" || rzpKey === "";
      
      console.log("Initiating payment. isDummy:", isDummy);

      // 1. Create order on backend
      let order;
      try {
        order = await api.payments.createOrder({ clientFolderId, amount, guestName, paymentType });
        console.log("Order created:", order);
      } catch (err: any) {
        console.error("Order creation failed:", err);
        setError("Payment API Error. Use bypass below to continue.");
        setLoading(false);
        return;
      }

      if (isDummy) {
        console.log("Dummy mode detected. Auto-unlocking...");
        // In dummy mode, we don't call backend verify because it will fail signature check
        // unless the backend is also explicitly in dummy mode.
        // We just succeed immediately.
        onSuccess("dummy_access_token_" + Math.random().toString(36).substring(7));
        return;
      }

      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: rzpKey,
        amount: order.amount * 100,
        currency: "INR",
        name: "Aura Photography",
        description: `${paymentType === 'GLOBAL' ? 'Global Access Pass' : 'Collection Access Fee'}`,
        order_id: order.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              clientFolderId: clientFolderId
            };
            const result = await api.payments.verify(verifyData);
            if (result.status === "success") {
              onSuccess(result.guestToken);
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
          }
        },
        prefill: {
          name: guestName || "Guest User",
          email: "guest@example.com",
        },
        theme: {
          color: "#38BDF8",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setError(typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 text-[11px] p-4 rounded-2xl text-red-400 border border-red-400/20 bg-red-400/5">
          {error}
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePayment}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-black bg-white transition-all shadow-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${amount} to Unlock`}
      </motion.button>
      
      {/* Bypass Button for Dev/Testing */}
      <button 
        onClick={handleBypass}
        className="mt-4 text-[9px] uppercase tracking-widest text-white/20 hover:text-[#38BDF8] transition-colors"
      >
        Skip Payment (Testing Mode)
      </button>

      <p className="text-[9px] uppercase tracking-[0.2em] mt-6 font-bold text-white/20">
        Secure payments powered by Razorpay
      </p>
    </div>
  );
}
