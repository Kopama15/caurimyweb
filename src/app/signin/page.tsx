'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<'start' | 'password' | 'otp'>('start');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const isEmail = identifier.includes('@');

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  }, []);

  const handleContinue = async () => {
    if (!identifier) return alert("Veuillez entrer un email ou un numéro.");

    if (isEmail) {
      setStep('password');
    } else if (identifier.startsWith('+')) {
      try {
        const result = await signInWithPhoneNumber(auth, identifier, window.recaptchaVerifier!);
        setConfirmation(result);
        setStep('otp');
        alert('OTP envoyé !');
      } catch (err) {
        console.error(err);
        alert("Erreur d'envoi de l'OTP");
      }
    } else {
      alert("Format de numéro incorrect. Utilisez +225...");
    }
  };

  const applyUserProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const data = snap.data();
      if (data?.firstName) {
        await updateProfile(auth.currentUser!, {
          displayName: data.firstName,
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    }
  };

  const handleLoginWithEmail = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, identifier, password);
      await applyUserProfile(result.user.uid);
      alert('✅ Connecté avec succès !');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Email ou mot de passe invalide');
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmation || !otp) return alert("Veuillez entrer l'OTP.");
    try {
      const result = await confirmation.confirm(otp);
      await applyUserProfile(result.user.uid);
      alert('✅ Connecté avec votre numéro !');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('OTP invalide');
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center p-4">
      <div className="w-full max-w-md border border-gray-300 p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Connexion ou création de compte</h1>

        {/* Step 1: Enter email or phone */}
        {step === 'start' && (
          <>
            <input
              type="text"
              placeholder="Email ou numéro (+225...)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="border w-full p-2 mb-4 rounded"
            />
            <button
              onClick={handleContinue}
              className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
            >
              Continuer
            </button>
          </>
        )}

        {/* Step 2: Password */}
        {step === 'password' && (
          <>
            <label className="text-sm mb-1 block text-gray-700">
              Mot de passe pour {identifier}
            </label>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border w-full p-2 mb-4 rounded"
            />
            <button
              onClick={handleLoginWithEmail}
              className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
            >
              Se connecter
            </button>
          </>
        )}

        {/* Step 3: OTP */}
        {step === 'otp' && (
          <>
            <label className="text-sm mb-1 block text-gray-700">
              Code OTP envoyé à {identifier}
            </label>
            <input
              type="text"
              placeholder="Entrer OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border w-full p-2 mb-4 rounded"
            />
            <button
              onClick={handleVerifyOTP}
              className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
            >
              Vérifier & Se connecter
            </button>
          </>
        )}

        <div id="recaptcha-container" />

        <p className="mt-6 text-xs text-gray-500 text-center">
          En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </p>
        <p className="text-sm mt-4 text-center">
          Nouveau client ?{' '}
          <span
            onClick={() => (window.location.href = '/signup')}
            className="text-blue-600 cursor-pointer underline"
          >
            Créer un compte
          </span>
        </p>
      </div>
    </div>
  );
}
