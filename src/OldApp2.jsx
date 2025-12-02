import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- CONTEXT IMPORT ---
import { useAuth } from './context/AuthContext'; // <--- NEW: Import the useAuth hook

// --- FIREBASE IMPORTS (Auth, Firestore, Storage) ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query } from 'firebase/firestore';
// We only need the data-related Firestore and Storage imports now, as Auth is in Context.
import { getStorage } from 'firebase/storage'; 


// --- UI ICON IMPORTS ---
import { Camera, RefreshCcw, Loader2, BookOpen, CheckSquare, Square, RotateCw, X, Star, Search, Scan, Database, FileText, ArrowRight } from 'lucide-react';

// ------------------------------------
// --- 1. CONFIGURATION AND INITIALIZATION ---
// ------------------------------------

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const MAX_CONCURRENT_FAST_SCANS = 2;
const DELAY_MS = 2500;
const RESIZE_WIDTH_PX = 300;
const JPEG_QUALITY = 0.70;
const SKU_PREFIX = 'CAI'; // Comic AI Inventory

// --- COMIC GRADING SCALE ---
const COMIC_GRADES = [
  { value: 'Unassigned', label: 'Unassigned Grade' },
  { value: '10.0', label: '10.0 Gem Mint (GM)' },
  { value: '9.8', label: '9.8 Near Mint/Mint (NM/M)' },
  { value: '9.6', label: '9.6 Near Mint Plus (NM+)' },
  { value: '9.4', label: '9.4 Near Mint (NM)' },
  { value: '9.2', label: '9.2 Near Mint Minus (NM-)' },
  { value: '9.0', label: '9.0 Very Fine/Near Mint (VF/NM)' },
  { value: '8.5', label: '8.5 Very Fine Plus (VF+)' },
  { value: '8.0', label: '8.0 Very Fine (VF)' },
  { value: '7.5', label: '7.5 Very Fine Minus (VF-)' }, // Corrected: VG- not VF-
  { value: '7.0', label: '7.0 Fine/Very Fine (FN/VF)' },
  { value: '6.5', label: '6.5 Fine Plus (FN+)' },
  { value: '6.0', label: '6.0 Fine (FN)' },
  { value: '5.5', label: '5.5 Fine Minus (FN-)' },
  { value: '5.0', label: '5.0 Very Good/Fine (VG/FN)' },
  { value: '4.5', label: '4.5 Very Good Plus (VG+)' },
  { value: '4.0', label: '4.0 Very Good (VG)' },
  { value: '3.5', label: '3.5 Very Good Minus (VG-)' },
  { value: '3.0', label: '3.0 Good/Very Good (G/VG)' },
  { value: '2.5', label: '2.5 Good Plus (G+)' },
  { value: '2.0', label: '2.0 Good (G)' },
  { value: '1.8', label: '1.8 Good Minus (G-)' },
  { value: '1.5', label: '1.5 Fair/Poor (F/P)' },
 { value: '1.0', label: '1.0 Fair (FA)' },
  { value: '0.5', label: '0.5 Poor (Poor)' },
   { value: '0.3', label: '0.3 Extremely Poor (Poor-)' },
    { value: '0.1', label: '0.1 Incomplete (INC)' },
];


// --- YOUR ACTUAL FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyALrwf4LpQO2R8bTfcrnK04fHhRj0I1Yx8",
  authDomain: "comicsnap-af94c.firebaseapp.com",
  projectId: "comicsnap-af94c",
  storageBucket: "comicsnap-af94c.firebasestorage.app",
  messagingSenderId: "106369788670",
  appId: "1:106369788670:web:880d3b8b304c67f29193af",
  measurementId: "G-5PGQ6JMSM7"
};
// --- END FIREBASE CONFIGURATION ---

// Initialize Firebase Services GLOBALLY
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();


// ------------------------------------
// --- 2. THE SINGLE MAIN APP COMPONENT (Exported) ---
// ------------------------------------

export default function App() { 
  
  // --- AUTHENTICATION STATE (DERIVED FROM CONTEXT) ---
  const { currentUser, loading } = useAuth(); // <--- Get state from AuthContext
  
  // Derive simple state variables from context for clarity
  const user = currentUser;
  const userId = currentUser?.uid ?? null;
  const isLoggedIn = !!currentUser; 

  // --- APPLICATION DATA STATE ---
  const [scannedComics, setScannedComics] = useState([]);
  const [inventory, setInventory] = useState([]);
  // Retaining other state variables and refs you had previously
  const [isScanning, setIsScanning] = useState(false);
  const [queue, setQueue] = useState([]);
  const [imageToReview, setImageToReview] = useState(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const scanCountRef = useRef(0);
  const lastScanTimeRef = useRef(0);
  
  
  // 1. FIRESTORE DATA LISTENERS (Now relies solely on context state)
  useEffect(() => {
    // CRITICAL: Only proceed if user is confirmed logged in
    if (!isLoggedIn || !userId) {
      console.log("[Firestore Listeners] SKIPPING: User is not logged in.");
      setScannedComics([]);
      setInventory([]);
      return;
    }
    console.log("[Firestore Listeners] Initializing Firestore listeners for UID:", userId);

    // Listener for STAGING AREA (scanned_comics)
    const stagingPath = `artifacts/${firebaseConfig.appId}/public/data/scanned_comics`;
    const qStaging = query(collection(db, stagingPath));

    const unsubscribeStaging = onSnapshot(qStaging, (snapshot) => {
      const comics = [];
      snapshot.forEach((doc) => {
        comics.push({ id: doc.id, ...doc.data() });
      });
      comics.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setScannedComics(comics);
    }, (error) => {
      console.error("Error listening to Staging Firestore:", error);
    });

    // Listener for INVENTORY
    const inventoryPath = `artifacts/${firebaseConfig.appId}/public/data/inventory`;
    const qInventory = query(collection(db, inventoryPath));

    const unsubscribeInventory = onSnapshot(qInventory, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        items.sort((a, b) => a.sku.localeCompare(b.sku));
        setInventory(items);
    }, (error) => {
        console.error("Error listening to Inventory Firestore:", error);
    });

    return () => {
      unsubscribeStaging();
      unsubscribeInventory();
    };
  }, [isLoggedIn, userId]); // Reruns when login status changes


  // 2. CONDITIONAL RENDERING (The Return Block)

// --- 2. CONDITIONAL RENDERING (The Return Block) ---

// NOTE: We don't need to check 'loading' here since AuthProvider handles the initial screen.

  if (!isLoggedIn) {
    // If the user is NOT logged in, show the component that contains 
    // ALL your sign-in options (Email/Password forms, Google button, etc.)
    return <YourPrimaryLoginComponent />; // <--- CHANGE THIS COMPONENT NAME
  }


  // User is logged in (anonymously or permanently)
  return (
    <MainAppScreen 
      user={user} 
      userId={userId} 
      db={db} 
      storage={storage} 
      isLoggedIn={isLoggedIn}
      isAnonymous={user?.isAnonymous ?? false} 
      inventory={inventory}
      // ... pass other application state and functions ...
    />
  );
}

// ... (The rest of your App component code) ...

  // 2. CONDITIONAL RENDERING (The Return Block)

  if (loading) {
    // AuthProvider handles this, but return a safety null/placeholder if needed
    return null; // Use 'null' here for safety, not <WelcomeScreen />
  }

  if (!isLoggedIn) {
    // RENDER THE NEW, FUNCTIONAL LOGIN FORM!
    return <LoginForm />; // <--- This will display your Email/Google Sign-In options
  }

  // User is logged in (anonymously or permanently)
  return (
    <MainAppScreen 
      user={user} 
      userId={userId} 
      db={db} 
      storage={storage} 
      isLoggedIn={isLoggedIn}
      isAnonymous={user?.isAnonymous ?? false} 
      inventory={inventory}
      // ... pass other application state and functions ...
    />
  );
} // End of export default function App()


// ------------------------------------
// --- 3. COMPONENT DEFINITIONS (Must be OUTSIDE App) ---
// ------------------------------------

// Component shown while the app is checking for a user
function WelcomeScreen() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', background: '#e0f7fa' }}>
            <h1>ComicSnap! 📚</h1>
            <p>Checking security status... Please wait.</p>
        </div>
    );
}

// Component shown only if the anonymous login fails
function SignInScreen() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
            <h2>⚠️ Authentication Error</h2>
            <p>We could not sign you in, even anonymously. Please check your network connection and ensure Firebase Anonymous Authentication is enabled.</p>
        </div>
    );
}

// Component shown when the user is signed in (main app content)
function MainAppScreen({ user, userId, isAnonymous }) {
    const handleLogout = async () => {
        // We rely on the globally initialized 'auth' object here
        await signOut(auth);
    };

    return (
        <div style={{ padding: '20px', border: '2px solid #28a745', background: '#d4edda' }}>
            <h2>✅ Welcome to ComicSnap! (Logged In)</h2>
            <p>Status: **{isAnonymous ? 'Temporary Anonymous User' : 'Permanent User'}**</p>
            <p>User ID: **{userId}**</p>
            <p>This is where your comics content will be displayed!</p>
            
            {/* The Upgrade Account Prompt goes here, if needed */}
            {isAnonymous && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#ffc107' }}>
                    **Action Required:** Your account is temporary. You need to add a permanent Sign-In/Upgrade Account feature here.
                </div>
            )}

            <button onClick={handleLogout} style={{ marginTop: '15px', padding: '10px 20px', background: 'red', color: 'white', border: 'none' }}>
                Sign Out
            </button>
        </div>
    );
}