'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { IoMdArrowDropdown } from 'react-icons/io';
import { onSnapshot, doc, collection, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Navbar = () => {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Détection de votre position...');
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('utilisateur');
  const [wallet, setWallet] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [languageCode, setLanguageCode] = useState('fr');
  const [flagUrl, setFlagUrl] = useState('https://flagcdn.com/fr.svg');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 12) setGreeting('Bonjour');
      else if (hour >= 12 && hour < 19) setGreeting('Bon après-midi');
      else setGreeting('Bonsoir');
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || '';
          const country = data.address.country || '';
          const countryCode = data.address.country_code?.toLowerCase() || 'fr';

          setLocation(`Livraison à ${city}, ${country}`);
          setLanguageCode(countryCode);
          setFlagUrl(`https://flagcdn.com/${countryCode}.svg`);
        } catch {
          setLocation('Impossible de détecter la localisation');
        }
      }, () => {
        setLocation('Accès à la localisation refusé');
      });
    } else {
      setLocation('Géolocalisation non supportée');
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.data();
          const firstName = userData?.firstName || user.displayName || 'utilisateur';
          setUserName(firstName);
        } catch {
          setUserName('utilisateur');
        }

        if (Notification.permission !== 'granted') {
          Notification.requestPermission();
        }

        let lastAmount = 0;
        const earningsRef = doc(db, 'users', user.uid, 'earnings', 'current');
        const unsubscribeEarnings = onSnapshot(earningsRef, (snapshot) => {
          const data = snapshot.data();
          const amount = data?.amount || 0;

          if (amount > lastAmount && Notification.permission === 'granted') {
            new Notification('📈 Nouveau gain reçu !', {
              body: `Vous avez gagné FCFA ${amount - lastAmount}`,
              icon: '/cauri-icon.png',
            });
          }

          lastAmount = amount;
          setWallet(amount);
        });

        const unsubscribeCart = onSnapshot(collection(db, 'users', user.uid, 'cart'), (snapshot) => {
          setCartCount(snapshot.size);
        });

        return () => {
          unsubscribeEarnings();
          unsubscribeCart();
        };
      } else {
        setIsLoggedIn(false);
        setUserName('utilisateur');
        setWallet(0);
        setCartCount(0);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'admin', 'announcement'), (docSnap) => {
      const data = docSnap.data();
      if (data?.text) setAnnouncement(data.text);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setUserName('utilisateur');
    setWallet(0);
    setCartCount(0);
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="w-full bg-[#131921] text-white text-sm font-medium">
      <div className="flex flex-wrap items-center px-4 py-2 gap-4 md:gap-2 justify-between md:justify-start">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push('/')}>...
        </div>

        <div className="flex items-center text-xs cursor-pointer max-w-xs">
          <MdLocationOn size={20} className="mr-1" />
          <div>
            <p className="text-gray-300">{location}</p>
            <p className="font-semibold text-white hover:underline">Mettre à jour la position</p>
          </div>
        </div>

        <div className="flex flex-grow bg-white rounded overflow-hidden text-black max-w-3xl min-w-[200px]">
          ...
        </div>

        <div className="flex items-center space-x-1 cursor-pointer">
          <img src={flagUrl} alt={languageCode.toUpperCase()} width={20} height={20} className="w-5 h-5" />
          <span className="uppercase">{languageCode}</span>
          <IoMdArrowDropdown />
        </div>

        <div className="flex flex-col justify-center text-xs">
          <span className="text-gray-300">{greeting}, {userName}</span>
          {isLoggedIn ? (
            <span onClick={handleLogout} className="font-semibold hover:underline cursor-pointer">
              Compte / Se déconnecter
            </span>
          ) : (
            <div className="flex gap-1 text-white">
              <span onClick={() => router.push('/signin')} className="hover:underline font-semibold cursor-pointer">
                Se connecter
              </span>
              <span>/</span>
              <span onClick={() => router.push('/signup')} className="hover:underline font-semibold cursor-pointer">
                S’inscrire
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col justify-center text-left cursor-pointer">
          <span onClick={() => router.push('/retours')} className="text-gray-300 hover:underline">Retours</span>
          <span onClick={() => router.push('/commandes')} className="font-semibold hover:underline">
            & Commandes
          </span>
        </div>

        <div
          onClick={() => router.push(isLoggedIn ? '/mon-portefeuille' : '/signin')}
          title="Détails portefeuille"
          className="flex flex-col justify-center items-end cursor-pointer hover:underline"
        >
          <span className="text-green-400 font-bold">FCFA {wallet.toLocaleString()}</span>
          <span className="text-xs">Portefeuille</span>
        </div>

        <div
          onClick={() => router.push('/panier')}
          className="relative flex items-center cursor-pointer hover:underline"
          title="Voir votre panier"
        >
          <FaShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute top-[-6px] left-3 bg-yellow-400 text-black text-xs font-bold px-1 rounded-full">
              {cartCount}
            </span>
          )}
          <span className="ml-1">Panier</span>
        </div>
      </div>

      {announcement && (
        <div className="overflow-hidden whitespace-nowrap bg-[#232f3e] text-white text-sm py-2">
          <div className="animate-marquee inline-block px-4">
            📢 {announcement}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
