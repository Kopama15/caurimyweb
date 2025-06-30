"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AuthEmail() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Signed up successfully!");
    } catch (err) {
      console.error(err);
      alert("Sign up error");
    }
  };

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Signed in!");
    } catch (err) {
      console.error(err);
      alert("Sign in error");
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
      />
      <div className="flex gap-2">
        <button onClick={signUp} className="bg-blue-600 text-white px-4 py-2 w-full">
          Sign Up
        </button>
        <button onClick={signIn} className="bg-green-600 text-white px-4 py-2 w-full">
          Sign In
        </button>
      </div>
    </div>
  );
}
