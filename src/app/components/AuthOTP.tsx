"use client";

import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function AuthOTP() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !window.recaptchaVerifier &&
      recaptchaRef.current
    ) {
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        }
      );

      verifier.render().then((widgetId) => {
        window.recaptchaVerifier = verifier;
        console.log("reCAPTCHA rendered:", widgetId);
      });
    }
  }, []);

  const sendOTP = async () => {
    if (!phone.startsWith("+")) {
      alert("Use full international format like +1234567890");
      return;
    }

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmation(result);
      alert("OTP sent!");
    } catch (error) {
      console.error("sendOTP error:", error);
      alert("OTP failed.");
    }
  };

  const verifyOTP = async () => {
    if (!confirmation) return alert("Request OTP first");

    try {
      const result = await confirmation.confirm(otp);
      alert("✅ Verified!");
      console.log("User:", result.user);
    } catch (error) {
      console.error("verifyOTP error:", error);
      alert("Invalid OTP");
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-sm mx-auto">
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1234567890"
        className="border p-2 w-full"
      />
      <button onClick={sendOTP} className="bg-blue-600 text-white px-4 py-2 w-full">
        Send OTP
      </button>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        className="border p-2 w-full"
      />
      <button onClick={verifyOTP} className="bg-green-600 text-white px-4 py-2 w-full">
        Verify OTP
      </button>

      <div ref={recaptchaRef} id="recaptcha-container" />
    </div>
  );
}
