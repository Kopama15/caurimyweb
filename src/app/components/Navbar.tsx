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
  const [location, setLocation] = useState('');
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('utilisateur');
  const [wallet, setWallet] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [languageCode, setLanguageCode] = useState('fr');
  const [flagUrl, setFlagUrl] = useState('https://flagcdn.com/fr.svg');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 19) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
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
      }, () => setLocation('Accès à la localisation refusé'));
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const firstName = snap.data()?.firstName || user.displayName || 'utilisateur';
          setUserName(firstName);
        } catch {
          setUserName(user.displayName || 'utilisateur');
        }

        const earnRef = doc(db, 'users', user.uid, 'earnings', 'current');
        const cartRef = collection(db, 'users', user.uid, 'cart');

        const unsubEarn = onSnapshot(earnRef, (snap) => {
          const amount = snap.data()?.amount || 0;
          setWallet(amount);
        });

        const unsubCart = onSnapshot(cartRef, (snap) => {
          setCartCount(snap.size);
        });

        return () => {
          unsubEarn();
          unsubCart();
        };
      } else {
        setIsLoggedIn(false);
        setWallet(0);
        setCartCount(0);
        setUserName('utilisateur');
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'admin', 'announcement'), (snap) => {
      const data = snap.data();
      if (data?.text) setAnnouncement(data.text);
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSearch = () => {
    if (query.trim()) router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="w-full bg-[#131921] text-white text-sm font-medium">
      <div className="flex flex-wrap items-center px-4 py-2 gap-4 md:gap-2">
        {/* Logo */}
        <div onClick={() => router.push('/')} className="flex items-center gap-1 cursor-pointer">
          <Image src="/cauri-icon.png" alt="Cauri Logo" width={24} height={24} />
          <h1 className="text-2xl font-bold text-blue-500">Cauri</h1>
        </div>

        {/* Location */}
        <div className="flex items-center text-xs max-w-xs">
          <MdLocationOn size={20} className="mr-1" />
          <div>
            <p className="text-gray-300">{location}</p>
            <p className="font-semibold hover:underline">Mettre à jour la position</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-grow bg-white rounded overflow-hidden text-black max-w-2xl min-w-[200px]">
          <select
            className="bg-gray-100 px-2 border-r border-gray-300 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {['Tout', 'Électronique', 'Vêtements', 'Maison', 'Livres', 'Jouets', 'Beauté', 'Épicerie'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Rechercher dans ${selectedCategory}`}
            className="flex-grow px-2 py-2 outline-none"
          />
          <button onClick={handleSearch} className="bg-yellow-400 px-4 flex items-center justify-center">
            <FaSearch />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 md:ml-auto">
          {/* Language */}
          <div className="flex items-center gap-1">
            <img src={flagUrl} alt={languageCode.toUpperCase()} width={20} height={20} />
            <span className="uppercase">{languageCode}</span>
            <IoMdArrowDropdown />
          </div>

          {/* Greeting & Auth */}
          <div className="flex flex-col text-xs">
            <span className="text-gray-300">{greeting}, {userName}</span>
            {isLoggedIn ? (
              <span onClick={handleLogout} className="font-semibold hover:underline cursor-pointer">
                Compte / Se déconnecter
              </span>
            ) : (
              <div className="flex gap-1">
                <span onClick={() => router.push('/signin')} className="font-semibold hover:underline cursor-pointer">
                  Se connecter
                </span>
                <span>/</span>
                <span onClick={() => router.push('/signup')} className="font-semibold hover:underline cursor-pointer">
                  S’inscrire
                </span>
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="hidden md:flex flex-col text-left cursor-pointer">
            <span onClick={() => router.push('/retours')} className="text-gray-300 hover:underline">Retours</span>
            <span onClick={() => router.push('/commandes')} className="font-semibold hover:underline">
              & Commandes
            </span>
          </div>

          {/* Wallet */}
          <div
            onClick={() => router.push(isLoggedIn ? '/mon-portefeuille' : '/signin')}
            className="flex flex-col justify-center items-end cursor-pointer hover:underline"
          >
            <span className="text-green-400 font-bold">FCFA {wallet.toLocaleString()}</span>
            <span className="text-xs">Portefeuille</span>
          </div>

          {/* Cart */}
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
      </div>

      {/* Announcement Bar */}
      {announcement && (
        <div className="overflow-hidden whitespace-nowrap bg-[#232f3e] text-white text-sm py-2">
          <div className="animate-marquee inline-block px-4">📢 {announcement}</div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
