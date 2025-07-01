// src/app/components/BottomNavbar.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BottomNavbar() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const newAnnouncements = snapshot.docs.map(doc => doc.data().text);
      setAnnouncements(newAnnouncements);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full bg-yellow-400 text-black px-4 py-2 text-sm font-medium overflow-x-auto whitespace-nowrap flex items-center gap-4 animate-pulse">
      {announcements.length > 0 ? (
        announcements.map((text, index) => (
          <span key={index}>{text}</span>
        ))
      ) : (
        <span>Chargement des annonces...</span>
      )}
    </div>
  );
}
