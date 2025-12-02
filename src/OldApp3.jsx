import React, { useState, useEffect, useRef } from 'react';

// --- CONTEXT IMPORT ---
import { useAuth } from './context/AuthContext'; 

// --- FIREBASE IMPORTS (Now importing initialized services from ./firebase) ---
import { auth, db, storage, googleProvider } from './firebase'; 
import { 
  signOut, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // <--- NEW STORAGE IMPORTS

// --- UI ICON IMPORTS ---
import { RotateCw } from 'lucide-react';

// ------------------------------------
// --- 1. CONFIGURATION ---
// ------------------------------------

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const MAX_CONCURRENT_FAST_SCANS = 2;
const DELAY_MS = 2500;
const SKU_PREFIX = 'CAI'; 

// ------------------------------------
// --- 2. THE MAIN APP COMPONENT ---
// ------------------------------------

export default function App() { 
  
  // --- AUTHENTICATION STATE (Derived from Context) ---
  const { currentUser, loading } = useAuth(); 
  
  const user = currentUser;
  const userId = currentUser?.uid ?? null;
  const isLoggedIn = !!currentUser; 

  // --- APPLICATION DATA STATE ---
  const [scannedComics, setScannedComics] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  // --- SCANNING STATE AND REFS ---
  const [isScanning, setIsScanning] = useState(false);
  const [queue, setQueue] = useState([]);
  const [imageToReview, setImageToReview] = useState(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const scanCountRef = useRef(0);
  const lastScanTimeRef = useRef(0);
  
  // --- IMAGE SCANNING LOGIC ---
  const handleImageScan = async (imageFile) => {
    // 1. INPUT VALIDATION
    if (!imageFile || !user || !userId) {
        console.error("Scanning failed: Image file or user not available.");
        return;
    }

    // 2. RATE LIMITING (Optional but Recommended)
    const now = Date.now();
    if (scanCountRef.current >= MAX_CONCURRENT_FAST_SCANS && (now - lastScanTimeRef.current) < DELAY_MS) {
        console.warn("Rate limit triggered. Skipping scan.");
        return;
    }

    // 3. UI STATE UPDATE
    const newQueueItem = { 
        id: crypto.randomUUID(), 
        status: 'Processing', 
        file: imageFile, 
        progress: 0, 
        error: null 
    };

    setQueue(prevQueue => [...prevQueue, newQueueItem]);
    setIsScanning(true);
    
    scanCountRef.current += 1;
    lastScanTimeRef.current = now; 

    console.log(`[Scan Initiated] Processing new image: ${imageFile.name}`);

    // 4. IMAGE RESIZING & UPLOAD
    let downloadUrl;
    try {
        // [STEP 4a: RESIZING] Placeholder for actual resizing
        const resizedBlob = imageFile; 
        
        // Define the Storage path: comics/USER_ID/UUID.jpg
        const imageRef = ref(storage, `comics/${userId}/${newQueueItem.id}.jpg`);

        // [STEP 4b: UPLOAD] Upload the image file
        await uploadBytes(imageRef, resizedBlob);
        
        // Get the public URL for the uploaded file
        downloadUrl = await getDownloadURL(imageRef);

        console.log(`[Storage] Image uploaded successfully. URL: ${downloadUrl}`); // <--- SUCCESS LOG
        
        // Update the queue status to reflect progress (e.g., 'Uploaded')
        setQueue(prevQueue => prevQueue.map(item => 
            item.id === newQueueItem.id ? { ...item, status: 'Uploaded', progress: 50, downloadUrl: downloadUrl } : item
        ));
        
    } catch (uploadError) {
        console.error("Image processing/upload error:", uploadError);
        setQueue(prevQueue => prevQueue.map(item => 
            item.id === newQueueItem.id ? { ...item, status: 'Failed', error: uploadError.message } : item
        ));
        setIsScanning(false);
        return;
    }
    
    // 5. GEMINI API CALL (AI Analysis)
    try {
        // **TODO: IMPLEMENT GEMINI API CALL HERE**
        
        const analysisResult = {
            issue: "Amazing Fantasy",
            number: "15",
            year: 1962,
            publisher: "Marvel"
        };
        
        // 6. DB WRITE (Save the analyzed comic to Firestore)
        // **TODO: IMPLEMENT FIRESTORE WRITE HERE**
        
        setQueue(prevQueue => prevQueue.map(item => 
            item.id === newQueueItem.id ? { ...item, status: 'Complete', progress: 100, result: analysisResult } : item
        ));

    } catch (analysisError) {
        console.error("AI Analysis/DB Write error:", analysisError);
        setQueue(prevQueue => prevQueue.map(item => 
            item.id === newQueueItem.id ? { ...item, status: 'Analysis Failed', error: analysisError.message } : item
        ));
    } finally {
        // 7. CLEANUP
        setQueue(prevQueue => prevQueue.filter(item => item.id !== newQueueItem.id));
        
        setIsScanning(false);
        scanCountRef.current -= 1;
    }
  };
  // --- END IMAGE SCANNING LOGIC ---
  
  // 1. FIRESTORE DATA LISTENERS
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setScannedComics([]);
      setInventory([]);
      return;
    }
    console.log("[Firestore Listeners] Initializing for UID:", userId);

    const APP_ID = '1:106369788670:web:880d3b8b304c67f29193af'; 
    
    // Listener for STAGING AREA
    const stagingPath = `artifacts/${APP_ID}/public/data/scanned_comics`;
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
    const inventoryPath = `artifacts/${APP_ID}/public/data/inventory`;
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
  }, [isLoggedIn, userId]);


  // --- 2. CONDITIONAL RENDERING ---

  if (loading) {
    return null; 
  }

  // IF NOT LOGGED IN: Show the LoginForm
  if (!isLoggedIn) {
    return <LoginForm />; 
  }

  // IF LOGGED IN: Show the Main App
  return (
    <MainAppScreen 
      user={user} 
      userId={userId} 
      db={db} 
      storage={storage} 
      isLoggedIn={isLoggedIn}
      isAnonymous={user?.isAnonymous ?? false} 
      inventory={inventory}
      // Pass the new scanning function and state
      handleImageScan={handleImageScan} 
      isScanning={isScanning}
      queue={queue}
    />
  );
} 

// ------------------------------------
// --- 3. HELPER COMPONENTS ---
// ------------------------------------

function MainAppScreen({ user, userId, isAnonymous, handleImageScan, isScanning, queue }) {
    const fileInputRef = useRef(null); // <--- ADDED REF
    
    const handleLogout = async () => {
        await signOut(auth);
    };
    
    // Handler for file input change
    const onFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            handleImageScan(event.target.files[0]);
            // Reset the input value so the same file can be scanned again
            event.target.value = null; 
        }
    };
    
    // Handler to click the hidden input
    const onScanButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div style={{ padding: '20px', border: '2px solid #28a745', background: '#d4edda' }}>
            <h2>✅ Welcome to ComicSnap! (Logged In)</h2>
            <p>Status: <strong>{isAnonymous ? 'Temporary Anonymous User' : 'Permanent User'}</strong></p>
            <p>User ID: <strong>{userId}</strong></p>
            
            <hr style={{margin: '15px 0'}} />
            
            {/* NEW SCAN UI IMPLEMENTATION */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                
                {/* 1. The Visible Scan Button */}
                <button
                    onClick={onScanButtonClick}
                    disabled={isScanning}
                    style={{
                        padding: '10px 20px',
                        background: isScanning ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {isScanning ? <RotateCw size={18} style={{marginRight: '8px', animation: 'spin 1s linear infinite'}} /> : 'SCAN NEW COMIC'}
                </button>
                
                {/* 2. The Hidden File Input */}
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={onFileChange} 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                />

                {/* 3. Status Display */}
                {isScanning && (
                    <p style={{ marginLeft: '15px', color: 'orange', fontWeight: 'bold' }}>
                        Processing... ({queue.length} in queue)
                    </p>
                )}
            </div>
            
            <button onClick={handleLogout} style={{ marginTop: '15px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
                Sign Out
            </button>
        </div>
    );
}

// --- 4. LOGIN FORM COMPONENT ---
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isSigningIn, setIsSigningIn] = useState(false);
    
    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSigningIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSigningIn(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setError(null);
        setIsSigningIn(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>ComicSnap Login</h2>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <form onSubmit={handleEmailSignIn} style={{ marginBottom: '20px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
                <button type="submit" disabled={isSigningIn} style={{ width: '100%', padding: '10px', background: isSigningIn ? '#ccc' : '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    {isSigningIn ? 'Signing In...' : 'Sign In with Email'}
                </button>
            </form>
            
            <button onClick={handleGoogleSignIn} disabled={isSigningIn} style={{ width: '100%', padding: '10px', background: '#db4437', color: 'white', border: 'none', cursor: 'pointer' }}>
                Sign In with Google
            </button>
        </div>
    );
}