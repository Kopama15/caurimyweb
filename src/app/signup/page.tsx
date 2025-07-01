'use client';

import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'email' | 'phone'>('email');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'phone' && recaptchaRef.current) {
      if (!window.recaptchaVerifier || window.recaptchaVerifier.destroyed) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
        });
        window.recaptchaVerifier.render().catch(console.error);
      }
    }
  }, [mode]);

  const handleEmailSignUp = async () => {
    if (password !== confirmPass) return alert('Les mots de passe ne correspondent pas.');
    if (!email || !password || !firstName || !lastName) return alert('Veuillez remplir tous les champs.');

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(result.user, {
        displayName: firstName,
      });

      await setDoc(doc(db, 'users', result.user.uid), {
        firstName,
        lastName,
        email: result.user.email,
        phone: '',
        createdAt: new Date(),
      });

      alert('✅ Compte créé avec succès !');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert("Erreur d'inscription");
    }
  };

  const handleSendOTP = async () => {
    if (!phone.startsWith('+')) return alert('Entrez un numéro valide au format international (+...)');

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA passed'),
        });
        await window.recaptchaVerifier.render();
      }

      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(result);
      alert('OTP envoyé !');
    } catch (err) {
      console.error('OTP Error:', err);
      alert("Erreur lors de l'envoi de l'OTP");
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmation || !otp || !firstName || !lastName) return alert("Veuillez remplir tous les champs et OTP.");

    try {
      const result = await confirmation.confirm(otp);

      await updateProfile(result.user, {
        displayName: firstName,
      });

      await setDoc(doc(db, 'users', result.user.uid), {
        firstName,
        lastName,
        email: '',
        phone: result.user.phoneNumber,
        createdAt: new Date(),
      });

      alert('✅ Téléphone vérifié et compte connecté !');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('OTP invalide');
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center p-4">
      <div className="w-full max-w-md border border-gray-300 p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center">Créer un compte</h1>

        <div className="mb-4 text-sm text-gray-600 text-center">
          {mode === 'email' ? (
            <>
              Utiliser votre adresse e-mail <br />
              <span onClick={() => setMode('phone')} className="text-blue-600 cursor-pointer underline">
                Utiliser un téléphone à la place
              </span>
            </>
          ) : (
            <>
              Utiliser votre numéro de téléphone <br />
              <span onClick={() => setMode('email')} className="text-blue-600 cursor-pointer underline">
                Utiliser un e-mail à la place
              </span>
            </>
          )}
        </div>

        <input
          type="text"
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
        />
        <input
          type="text"
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
        />

        {mode === 'email' ? (
          <>
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border w-full p-2 mb-3 rounded"
            />
            <input
              type="password"
              placeholder="Mot de passe (min. 6 caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border w-full p-2 mb-3 rounded"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="border w-full p-2 mb-4 rounded"
            />
            <button
              onClick={handleEmailSignUp}
              className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
            >
              Continuer
            </button>
          </>
        ) : (
          <>
            <input
              type="tel"
              placeholder="Numéro de téléphone (+225...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border w-full p-2 mb-3 rounded"
            />
            {!confirmation ? (
              <button
                onClick={handleSendOTP}
                className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
              >
                Envoyer OTP
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Entrer OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="border w-full p-2 my-3 rounded"
                />
                <button
                  onClick={handleVerifyOTP}
                  className="bg-yellow-400 text-black font-semibold w-full py-2 rounded hover:bg-yellow-500"
                >
                  Vérifier & Créer le compte
                </button>
              </>
            )}
            <div ref={recaptchaRef} id="recaptcha-container" />
          </>
        )}

        <p className="mt-6 text-xs text-gray-500 text-center">
          En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </p>
        <p className="text-sm mt-4 text-center">
          Vous avez déjà un compte ?{' '}
          <span onClick={() => (window.location.href = '/signin')} className="text-blue-600 cursor-pointer underline">
            Se connecter
          </span>
        </p>
      </div>
    </div>
  );
}
