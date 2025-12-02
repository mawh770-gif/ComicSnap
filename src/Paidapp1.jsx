// ------------------------------------
// --- 2. INNER APPLICATION COMPONENTS ---
// ------------------------------------

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// ... other imports ...

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // 1. Set up the state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // 2. Check if a user (any user) is logged in
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // 3. NO user found (initial load/logged out) - SIGN IN ANONYMOUSLY
        console.log("No user found, attempting anonymous sign-in...");
        signInAnonymously(auth)
          .then((anonUserCredential) => {
            // Success: User is now authenticated anonymously
            setUser(anonUserCredential.user);
            setIsLoading(false);
          })
          .catch((error) => {
            // Handle error, e.g., if anonymous auth isn't enabled (though you said it is!)
            console.error("Anonymous sign-in failed:", error);
            setIsLoading(false); 
            // Crucial: Set loading to false even on failure to avoid infinite spinner
          });
      }
    });

    return () => unsubscribe();
  }, []);

  // --- CONDITIONAL RENDERING ---

  if (isLoading) {
    // This is shown only until the anonymous sign-in attempt finishes
    return <WelcomeScreen />; 
  }

  // Since a user will ALWAYS exist (anonymously or permanently), 
  // you can now render your Main App Content, which includes a link/button 
  // for the user to 'Upgrade' or 'Link Account' (the proper sign-in screen).
  return <MainAppContent user={user} />;
}

export default App;
// Component shown when the user is signed in
// NOTE: This is where ALL your main ComicSnap! logic, routing, and UI will go.
function MainAppScreen({ user, userId, db, storage, isLoggedIn, ...appStateAndFunctions }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>📚 Welcome to ComicSnap! (Signed In)</h2>
      <p>Hello, **{user.email || 'User'}**! Your User ID is: **{userId}**</p>
      <p>This is where your comics and main content will be displayed.</p>
      {/* Example of displaying a piece of app state */}
      <p>Total items in Inventory: **{appStateAndFunctions.inventory.length}**</p>
      <button onClick={handleLogout} style={{ marginTop: '10px', padding: '10px 20px', background: 'red', color: 'white', border: 'none' }}>
        Sign Out
      </button>
    </div>
  );
}

// Component shown when the user is signed out
function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- A. Email/Password Sign-In/Sign-Up ---
  const handleSignIn = async (isSignUp) => {
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      console.log('User action successful, Auth State Listener will redirect.');
    } catch (e) {
      setError(e.message);
    }
  };

  // --- B. Google Sign-In with Popup ---
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful, Auth State Listener will redirect.');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h1>Welcome to ComicSnap!</h1>
      <p style={{ color: 'gray' }}>Please sign in to view your content.</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Email/Password Form */}
      <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Email/Password</h3>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
        <button onClick={() => handleSignIn(false)} style={{ width: '48%', padding: '10px', marginRight: '4%' }}>Sign In</button>
        <button onClick={() => handleSignIn(true)} style={{ width: '48%', padding: '10px' }}>Register</button>
      </div>

      {/* Google Sign-In Button */}
      <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '10px', background: '#4285F4', color: 'white', border: 'none' }}>
        Sign in with Google 🚀
      </button>
    </div>
  );
}

// ------------------------------------
// --- 3. THE SINGLE MAIN APP COMPONENT (Exported) ---
// ------------------------------------

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState(null); // The Firebase User object
  const [loading, setLoading] = useState(true); // Initial loading of Auth state
  const [userId, setUserId] = useState(null); // User ID for Firestore paths
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Clean boolean flag

  // --- APPLICATION DATA STATE ---
  const [scannedComics, setScannedComics] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [queue, setQueue] = useState([]);
  const [imageToReview, setImageToReview] = useState(null);
  const [isbnInput, setIsbnInput] = useState('');
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  
  // --- REFS ---
  const scanCountRef = useRef(0);
  const lastScanTimeRef = useRef(0);

  // 1. FIREBASE AUTHENTICATION STATE LISTENER
  // This is the core fix for your sign-in inability.
  useEffect(() => {
    // onAuthStateChanged runs immediately and on every sign-in/sign-out event
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserId(currentUser ? currentUser.uid : null);
      setIsLoggedIn(!!currentUser); // Convert to boolean
      setLoading(false);
      console.log(`Auth state changed: User is ${currentUser ? 'signed in' : 'signed out'}.`);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []); // Runs once on mount

  // 2. FIRESTORE DATA LISTENERS
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

  // 3. Conditional Rendering (The UI Logic)
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Loader2 className="animate-spin" /> Loading ComicSnap!</div>;
  }

  // Pass necessary state and functions down to the appropriate screen
  const appStateAndFunctions = {
    scannedComics, setScannedComics,
    inventory, setInventory,
    isScanning, setIsScanning,
    queue, setQueue,
    imageToReview, setImageToReview,
    isbnInput, setIsbnInput,
    isSearchingBarcode, setIsSearchingBarcode,
    scanCountRef, lastScanTimeRef,
    // Add all other functions (e.g., handleScan, processQueue, etc.) here
  };


  return (
    <div className="App">
      {user ? (
        <MainAppScreen 
          user={user} 
          userId={userId} 
          db={db} 
          storage={storage} 
          isLoggedIn={isLoggedIn}
          {...appStateAndFunctions} // Spreads all your other state and functions
        />
      ) : (
        <SignInScreen />
      )}
    </div>
  );
}

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

  // 3. Conditional Rendering (The UI Logic)
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Loader2 className="animate-spin" /> Loading ComicSnap!</div>;
  }

  // Pass necessary state and functions down to the appropriate screen
  const appStateAndFunctions = {
    scannedComics, setScannedComics,
    inventory, setInventory,
    isScanning, setIsScanning,
    queue, setQueue,
    imageToReview, setImageToReview,
    isbnInput, setIsbnInput,
    isSearchingBarcode, setIsSearchingBarcode,
    scanCountRef, lastScanTimeRef,
    // Add all other functions (e.g., handleScan, processQueue, etc.) here
  };


  return (
    <div className="App">
      {user ? (
        <MainAppScreen 
          user={user} 
          userId={userId} 
          db={db} 
          storage={storage} 
          isLoggedIn={isLoggedIn}
          {...appStateAndFunctions} // Spreads all your other state and functions
        />
      ) : (
        <SignInScreen />
      )}
    </div>
  );
}


  // 3. IMAGE PRE-PROCESSING FUNCTION (Resize, Convert, and ROTATE)
  const resizeImage = useCallback((file, rotation = 0) => { /* ... (unchanged) ... */ return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let originalWidth = img.width; let originalHeight = img.height; let newWidth = originalWidth; let newHeight = originalHeight; if (originalWidth > RESIZE_WIDTH_PX) { newHeight = originalHeight * (RESIZE_WIDTH_PX / originalWidth); newWidth = RESIZE_WIDTH_PX; } const absRotation = Math.abs(rotation % 360); const needsSwap = absRotation === 90 || absRotation === 270; canvas.width = needsSwap ? newHeight : newWidth; canvas.height = needsSwap ? newWidth : newHeight; const rad = rotation * (Math.PI / 180); ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rad); ctx.drawImage(img, -newWidth / 2, -newHeight / 2, newWidth, newHeight); const resizedBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY); resolve(resizedBase64); }; img.src = event.target.result; }; reader.onerror = (error) => reject(error); reader.readAsDataURL(file); }); }, []); // Added useCallback for stability

  // Helper function to handle AI response parsing
  const parseAiResponse = useCallback((rawText) => { /* ... (unchanged) ... */ let parsedData = {}; try { const jsonMatch = rawText.match(/\{[\s\S]*\}/); if (jsonMatch) { parsedData = JSON.parse(jsonMatch[0]); } else { parsedData = JSON.parse(rawText); } } catch (e) { console.warn("Could not parse AI response as JSON.", e); parsedData = { error_data: rawText }; } const title = parsedData.title || 'Unknown'; return { title: title, issue: parsedData.issue || 'N/A', publisher: parsedData.publisher || 'Unknown', year: parsedData.year || 'Unknown', status: title !== 'Unknown' ? 'scanned' : 'error', }; }, []); // Added useCallback for stability


  // 4b. BARCODE SEARCH LOGIC (Search Grounding API Call)
  const performBarcodeSearch = useCallback(async (identifier) => { // Added useCallback for stability
      if (!db || !userId) return; // Guard for Firebase services and user

      setIsSearchingBarcode(true);

      const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/scanned_comics`), {
          userId: userId,
          timestamp: serverTimestamp(),
          title: 'Searching Barcode...',
          issue: '...',
          publisher: '...',
          year: '...',
          grade: COMIC_GRADES[0].value,
          status: 'processing',
          isSelected: false,
          thumbnail: 'https://placehold.co/100x150/1f2937/d1d5db?text=ISBN',
      });

      const userPrompt = `Search for the comic book details associated with the ISBN or barcode: "${identifier}". Based on the search results, return the information in the following JSON format: { 'title': 'The main title of the comic', 'issue': 'The issue number or variant description', 'publisher': 'The comic book publisher', 'year': 'The publication year (e.g., 1995)' }. Do not include any other text, explanation, or markdown formatting outside of the single JSON object.`;

      const payload = {
          contents: [{ parts: [{ text: userPrompt }] }],
          tools: [{ "google_search": {} }],
      };

      let attempts = 0;
      const maxRetries = 3;

      while (attempts < maxRetries) {
          try {
              const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) { throw new Error(`API returned status ${response.status}`); }

              const result = await response.json();
              const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

              if (rawText) {
                  const data = parseAiResponse(rawText);
                  await updateDoc(doc(db, `artifacts/${appId}/public/data/scanned_comics`, docRef.id), { ...data, searchIdentifier: identifier });
                  setIsSearchingBarcode(false);
                  setIsbnInput('');
                  return;
              } else {
                  throw new Error("AI response was empty or malformed.");
              }
          } catch (error) {
              console.error(`Attempt ${attempts + 1} failed:`, error);
              attempts++;
              if (attempts < maxRetries) {
                  const delay = Math.pow(2, attempts) * 1000;
                  await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                  await updateDoc(doc(db, `artifacts/${appId}/public/data/scanned_comics`, docRef.id), { status: 'error', error: `Barcode search failed. Details: ${error.message}` });
                  setIsSearchingBarcode(false);
                  setIsbnInput('');
              }
          }
      }
  }, [db, userId, appId, geminiApiKey, parseAiResponse, setIsSearchingBarcode, setIsbnInput, COMIC_GRADES]); // Added dependencies for useCallback

 // 5. QUEUE PROCESSING LOGIC (Modified to upload to Cloud Storage)
  const processQueue = useCallback(async () => { // Added useCallback for stability
    console.log(`[ProcessQueue] Attempting to run. isScanning: ${isScanning}, queue length: ${queue.length}, DB ready: ${!!db}, User ID: ${userId}, Storage ready: ${!!storage}`);

    if (isScanning || queue.length === 0) return;

    if (!db || !userId || !storage) {
        console.warn("[ProcessQueue] SKIPPING: Firebase services or User ID not yet initialized. Waiting for dependencies.");
        return;
    }

    setIsScanning(true);
    const [nextItem] = queue;
    const { file, rotation } = nextItem;

    let newComicRef;
    try {
        const currentTime = Date.now();
        const timeSinceLastScan = currentTime - lastScanTimeRef.current;

        if (scanCountRef.current >= MAX_CONCURRENT_FAST_SCANS && timeSinceLastScan < DELAY_MS) {
            console.log(`[ProcessQueue] Rate limit hit. Delaying by ${DELAY_MS - timeSinceLastScan}ms.`);
            await new Promise(resolve => setTimeout(resolve, DELAY_MS - timeSinceLastScan));
            scanCountRef.current = 0;
        }

        console.log("[ProcessQueue] Creating temporary Firestore document for tracking.");
        newComicRef = await addDoc(collection(db, `artifacts/${appId}/public/data/scanned_comics`), {
            userId: userId,
            timestamp: serverTimestamp(),
            thumbnail: 'https://placehold.co/100x150/1f2937/d1d5db?text=Uploading...',
            title: 'Uploading...',
            issue: '...',
            publisher: '...',
            year: '...',
            grade: COMIC_GRADES[0].value,
            status: 'uploading',
            isSelected: false,
            originalFileName: file.name,
            originalRotation: rotation,
        });
        console.log(`[ProcessQueue] Temporary Firestore document created with ID: ${newComicRef.id}.`);

        const storagePath = `comics/${userId}/${newComicRef.id}/original_${Date.now()}`;
        const imageRef = ref(storage, storagePath);

        console.log(`[ProcessQueue] Uploading original image to Cloud Storage: ${storagePath}`);
        await uploadBytes(imageRef, file);

        await updateDoc(newComicRef, {
            originalStoragePath: storagePath,
            status: 'image-uploaded',
        });
        console.log(`[ProcessQueue] Original image uploaded to Storage and Firestore updated for doc: ${newComicRef.id}. Status: 'image-uploaded'`);

        scanCountRef.current += 1;
        lastScanTimeRef.current = Date.now();

    } catch (error) {
      console.error("[ProcessQueue] Error during image upload or Firestore update:", error);
      if (newComicRef) {
          await updateDoc(newComicRef, { status: 'error', error: `Upload Failed: ${error.message}` });
      }
    } finally {
        console.log("[ProcessQueue] Finished processing item. Removing from queue.");
        setQueue(prevQueue => prevQueue.slice(1));
        setIsScanning(false);
    }
  }, [queue, isScanning, db, userId, storage, appId, COMIC_GRADES]); // Added dependencies for useCallback


  // 6. INVENTORY AND EXPORT HANDLERS

  const generateSKU = useCallback((lastIndex) => { const nextIndex = lastIndex + 1; const paddedIndex = String(nextIndex).padStart(5, '0'); return `${SKU_PREFIX}-${paddedIndex}`; }, []); // Added useCallback for stability

  const sendToInventory = useCallback(async (comic) => { // Added useCallback for stability
    if (comic.status !== 'scanned' || comic.grade === COMIC_GRADES[0].value) {
        console.error("Comic not ready for inventory (must be scanned and graded).");
        return;
    }

    const nextSku = generateSKU(inventory.length);

    const inventoryItem = {
        userId: userId,
        sku: nextSku,
        title: comic.title,
        issue: comic.issue,
        publisher: comic.publisher,
        year: comic.year,
        grade: comic.grade,
        dateAdded: serverTimestamp(),
        thumbnail: comic.thumbnail,
    };

    const inventoryRef = doc(db, `artifacts/${appId}/public/data/inventory`, comic.id);

    try {
        await setDoc(inventoryRef, inventoryItem);
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/scanned_comics`, comic.id));
        console.log(`Successfully moved to inventory with SKU: ${nextSku}`);
    } catch (error) {
        console.error("Error moving comic to inventory:", error);
    }
  }, [db, userId, appId, inventory.length, generateSKU, COMIC_GRADES]); // Added dependencies for useCallback

  const exportToCSV = useCallback(() => { // Added useCallback for stability
    if (inventory.length === 0) {
      console.log("No items in inventory to export.");
      return;
    }

    const headers = ["SKU", "Title", "Issue", "Publisher", "Year", "Grade", "Date Added"];

    const csvRows = inventory.map(item => [
      item.sku,
      `"${item.title.replace(/"/g, '""')}"`,
      item.issue,
      item.publisher,
      item.year,
      item.grade,
      item.dateAdded?.toDate().toLocaleDateString() || 'N/A'
    ].join(','));

    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ComicSnap_Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [inventory]); // Added dependency for useCallback


  // 7. OTHER UI HANDLERS (simplified)

  const handleFileChange = useCallback((event) => { // Added useCallback for stability
    const file = event.target.files[0];
    if (file) {
        setImageToReview({ file, rotation: 0, url: URL.createObjectURL(file) });
        event.target.value = null;
    }
  }, []); // Empty dependency array means this runs once on mount.

  const handleRotation = useCallback(() => { // Added useCallback for stability
    if (imageToReview) {
      setImageToReview(prev => ({
        ...prev,
        rotation: (prev.rotation + 90) % 360
      }));
    }
  }, [imageToReview]); // Added dependency for useCallback

  const finalizeScan = useCallback(() => { // Added useCallback for stability
    if (imageToReview) {
      console.log("[FinalizeScan] Adding reviewed image to the processing queue.");
      setQueue(prevQueue => [...prevQueue, { file: imageToReview.file, rotation: imageToReview.rotation }]);
      setImageToReview(null);
    }
  }, [imageToReview]); // Added dependency for useCallback

  const handleBarcodeSubmit = useCallback((e) => { // Added useCallback for stability
    e.preventDefault();
    const cleanInput = isbnInput.trim();
    if (cleanInput && !isSearchingBarcode) {
        performBarcodeSearch(cleanInput);
    }
  }, [isbnInput, isSearchingBarcode, performBarcodeSearch]); // Added dependencies for useCallback

  const toggleSelected = useCallback(async (id, currentStatus) => { // Added useCallback for stability
    if (!db || !appId) return; // Guard for Firebase services
    const docRef = doc(db, `artifacts/${appId}/public/data/scanned_comics`, id);
    await updateDoc(docRef, { isSelected: !currentStatus });
  }, [db, appId]); // Added dependencies for useCallback

  const handleGradeChange = useCallback(async (id, newGrade) => { // Added useCallback for stability
    if (!db || !appId) return; // Guard for Firebase services
    if (newGrade === COMIC_GRADES[0].value) return;
    const docRef = doc(db, `artifacts/${appId}/public/data/scanned_comics`, id);
    await updateDoc(docRef, { grade: newGrade });
  }, [db, appId, COMIC_GRADES]); // Added dependencies for useCallback

  const selectAll = useCallback(async (select = true) => { // Added useCallback for stability
    if (!db || !appId) return; // Guard for Firebase services
    const batchUpdates = scannedComics.filter(c => c.isSelected !== select).map(comic => {
      const docRef = doc(db, `artifacts/${appId}/public/data/scanned_comics`, comic.id);
      return updateDoc(docRef, { isSelected: select });
    });
    await Promise.all(batchUpdates);
  }, [db, appId, scannedComics]); // Added dependencies for useCallback

  const deleteAll = useCallback(() => { // Added useCallback for stability
    const selectedCount = scannedComics.filter(c => c.isSelected).length;
    if (selectedCount > 0) {
        console.log(`Action: Would archive/delete ${selectedCount} selected comic(s).`);
    } else {
        console.log("No comics selected to archive/delete.");
    }
  }, [scannedComics]); // Added dependency for useCallback


  // --- REVISED LOADING AND LOGIN UI LOGIC ---
  // Show a generic initialization screen until the Firebase Auth SDK has processed its initial state.
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-2" />
        <p className="text-xl">Initializing Firebase services...</p>
      </div>
    );
  }

  // Once Firebase Auth SDK is ready, if the user is not logged in, show the login screen.
  if (!isLoggedIn) {
    // This is where you would render your actual login screen.
    // For now, a placeholder message indicating the need to log in.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white flex-col p-4">
        <Database className="text-indigo-400 mb-4" size={48} />
        <p className="text-xl font-bold mb-2">Welcome to ComicSnap!</p>
        <p className="text-gray-400 text-center max-w-sm">
          Please log in to manage your comic book inventory.
        </p>
        {/*
          // Placeholder for actual login buttons/form.
          // Example: Manual anonymous sign-in for quick testing:
          <button
            onClick={() => {
              if (auth) signInAnonymously(auth);
              else console.warn("Auth not initialized for anonymous sign-in attempt.");
            }}
            className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full shadow-lg transition-colors"
          >
            Continue as Guest (Anonymous)
          </button>
        */}
      </div>
    );
  }
  // --- END REVISED UI LOGIC ---

  // If isAuthReady and isLoggedIn are both true, render the main application UI.
  const allSelected = scannedComics.length > 0 && scannedComics.every(c => c.isSelected);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4">
      <header className="w-full max-w-4xl text-center py-6">
        <h1 className="text-4xl font-extrabold text-indigo-400">
          ComicSnap <span className="text-sm block font-light text-gray-400">AI Inventory System | User ID: {userId}</span>
        </h1>
        <p className="text-gray-500 mt-2">
            **Phase 3: Finalization & Export**
        </p>
      </header>

      {/* Upload/Scanner Area */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* --- 1. Image Upload Section --- */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-indigo-700/50">
            <h2 className="text-xl font-bold text-indigo-400 mb-4 flex items-center"><Camera className="mr-2" size={20} /> AI Cover Scan</h2>
            <label htmlFor="comic-upload" className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-indigo-500 text-indigo-400 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
            <Camera size={32} />
            <span className="mt-2 text-lg font-semibold">Snap or Upload Comic Cover</span>
            <span className="text-sm text-gray-500">Includes rotation review.</span>
            </label>
            <input
                id="comic-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isScanning || !!imageToReview || isSearchingBarcode}
                className="hidden"
            />

            <div className="mt-4 text-center">
                {queue.length > 0 && (
                    <p className="text-yellow-400 font-medium flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {scannedComics.filter(c => c.status === 'processing').length} processing. {queue.length} in queue.
                    </p>
                )}
            </div>
        </div>

        {/* --- 2. Barcode/ISBN Scanner Section --- */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-teal-700/50">
            <h2 className="text-xl font-bold text-teal-400 mb-4 flex items-center"><Scan className="mr-2" size={20} /> Barcode/ISBN Search</h2>
            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <p className="text-sm text-gray-400">Enter the 13-digit ISBN or 12-digit UPC barcode number below for an instant lookup.</p>
                <input
                    type="text"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    placeholder="Enter ISBN / Barcode number (e.g., 9780785135763)"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    disabled={isSearchingBarcode || isScanning || !!imageToReview}
                />
                <button
                    type="submit"
                    className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-lg transition-colors disabled:bg-teal-900 disabled:text-gray-500"
                    disabled={!isbnInput.trim() || isSearchingBarcode || isScanning || !!imageToReview}
                >
                    {isSearchingBarcode ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Searching Database...
                        </>
                    ) : (
                        <>
                            <Search size={20} className="mr-2" />
                            Search & Add to Staging
                        </>
                    )}
                </button>
            </form>
        </div>
      </div>

      {/* --- Pre-Scan Review Modal --- */}
      {imageToReview && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-indigo-400">Review & Orient Cover</h2>
                    <button onClick={() => setImageToReview(null)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <p className="text-sm text-gray-400 mb-4">Rotate until the comic is upright. Current rotation: {imageToReview.rotation}°</p>

                <div className="flex justify-center items-center h-80 bg-gray-900 rounded-lg overflow-hidden relative">
                    <img
                        src={imageToReview.url}
                        alt="Comic Cover to Review"
                        style={{ transform: `rotate(${imageToReview.rotation}deg)`, maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        className="transition-transform duration-300"
                    />
                </div>

                <div className="flex justify-between mt-6 space-x-4">
                    <button
                        onClick={handleRotation}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full shadow-lg transition-colors"
                    >
                        <RotateCw size={20} className="mr-2" />
                        Rotate 90° Clockwise
                    </button>
                    <button
                        onClick={finalizeScan}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-full shadow-lg transition-colors"
                    >
                        Finalize & Add to Scan Queue
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Staging Area Header */}
      <div className="w-full max-w-4xl mb-3 flex flex-col sm:flex-row justify-between items-center px-2 border-b border-gray-700 pb-2 mt-6">
        <h2 className="text-xl font-bold text-gray-300 flex items-center mb-2 sm:mb-0">
          <BookOpen className="mr-2 h-5 w-5 text-indigo-400" />
          Staging Area ({scannedComics.length} items)
        </h2>

        {scannedComics.length > 0 && (
            <div className="flex space-x-2">
                <button
                    onClick={() => selectAll(!allSelected)}
                    className="flex items-center px-3 py-1 text-xs rounded-full font-medium transition-colors bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                >
                    {allSelected ? 'Unselect All' : 'Select All'}
                </button>
                <button
                    onClick={deleteAll}
                    disabled={scannedComics.every(c => !c.isSelected)}
                    className="flex items-center px-3 py-1 text-xs rounded-full font-medium transition-colors bg-red-600 disabled:bg-red-900 disabled:text-gray-500 hover:bg-red-500 text-white shadow-lg"
                >
                    Archive Selected
                </button>
            </div>
        )}
      </div>

      {/* Scanned Comics List */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scannedComics.map((comic) => {
            // A comic is ready for inventory if it has been scanned AND graded
            const isReady = comic.status === 'scanned' && comic.grade !== COMIC_GRADES[0].value;
            return (
                <div
                    key={comic.id}
                    className={`bg-gray-800 rounded-xl shadow-xl p-4 transition-all duration-300 relative
                      ${comic.status === 'error' ? 'border-2 border-red-500' : 'border border-gray-700'}
                      ${isReady ? 'ring-2 ring-green-500/50' : ''}
                      ${comic.isSelected ? 'ring-4 ring-indigo-500/80' : ''}`
                    }
                >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2">
                        <button
                            onClick={() => toggleSelected(comic.id, comic.isSelected)}
                            className="text-white hover:text-indigo-400 transition-colors bg-gray-900/50 p-1 rounded-full"
                        >
                            {comic.isSelected ? <CheckSquare size={24} className="text-indigo-400" /> : <Square size={24} />}
                        </button>
                    </div>

                    <div className="flex space-x-4">
                        {/* Thumbnail (Left) */}
                        <div className="flex-shrink-0 w-[100px] h-auto">
                            {comic.thumbnail ? (
                                <img
                                    src={comic.thumbnail}
                                    alt="Comic Cover Thumbnail"
                                    className={`w-full h-auto rounded-lg shadow-md ${comic.status === 'processing' ? 'animate-pulse opacity-60' : ''}`}
                                />
                            ) : (
                                <div className="w-full h-[150px] bg-gray-700 flex items-center justify-center rounded-lg">
                                    {comic.status === 'processing' ? (
                                        <Loader2 className="animate-spin text-gray-500" />
                                    ) : (
                                        <Scan className="text-teal-400/50" size={32} />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Details (Right) */}
                        <div className="flex-grow min-w-0">
                            <p className={`text-sm font-semibold mb-1 truncate ${comic.status === 'processing' ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {comic.status === 'processing' ? 'Status: Working...' :
                                comic.status === 'error' ? 'Status: FAILED' :
                                'Status: Identified'}
                            </p>
                            <h3 className="text-lg font-bold truncate" title={comic.title}>{comic.title}</h3>
                            <p className="text-indigo-300 font-medium truncate">Issue: {comic.issue}</p>
                            <p className="text-gray-500 text-sm truncate">Publisher: {comic.publisher}</p>
                            <p className="text-gray-500 text-sm truncate">Year: {comic.year}</p>
                            {comic.searchIdentifier && (
                                <p className="text-xs text-teal-300 mt-1">ISBN/UPC: {comic.searchIdentifier}</p>
                            )}
                        </div>
                    </div>

                    {/* Condition Rating Section (Stage 2) */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center mb-3">
                            <Star size={18} className={`flex-shrink-0 mr-2 ${comic.grade && comic.grade !== COMIC_GRADES[0].value ? 'text-yellow-400' : 'text-gray-500'}`} />
                            <label className="text-sm font-medium flex-shrink-0 mr-2 text-gray-400">Grade:</label>
                            <select
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                                value={comic.grade || COMIC_GRADES[0].value}
                                onChange={(e) => handleGradeChange(comic.id, e.target.value)}
                                disabled={comic.status !== 'scanned'}
                            >
                                {COMIC_GRADES.map((grade) => (
                                    <option key={grade.value} value={grade.value}>
                                        {grade.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Send to Inventory Button (Stage 3) */}
                        <button
                            onClick={() => sendToInventory(comic)}
                            disabled={!isReady}
                            className={`w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                isReady
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-md'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <ArrowRight size={16} className="mr-2" />
                            Send to Inventory (SKU Ready)
                        </button>
                    </div>

                    {comic.status === 'error' && (
                        <p className="text-red-400 text-xs mt-2 p-2 bg-red-900/20 rounded">
                            Error: {comic.error || 'Failed to process comic or AI data.'}
                        </p>
                    )}
                </div>
            );
        })}
        {scannedComics.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center p-12 text-gray-500 italic">
            Your staging area is empty. Start scanning or searching!
          </div>
        )}
      </div>

      {/* Final Inventory Area (SKU Assigned) */}
      <div className="w-full max-w-4xl border-t border-gray-700 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4 flex-col sm:flex-row space-y-3 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-300 flex items-center text-green-400">
                <Database className="mr-2 h-5 w-5" />
                Final Inventory ({inventory.length} items)
            </h2>
            <button
                onClick={exportToCSV}
                disabled={inventory.length === 0}
                className="flex items-center w-full sm:w-auto justify-center px-4 py-2 text-sm rounded-full font-semibold transition-colors bg-yellow-600 hover:bg-yellow-500 text-gray-900 disabled:bg-gray-700 disabled:text-gray-500 shadow-lg"
            >
                <FileText size={16} className="mr-2" />
                Export Collection (CSV)
            </button>
        </div>

        {inventory.length > 0 ? (
            <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-2xl">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title/Issue</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Pub/Year</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {inventory.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-400">{item.sku}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <p className="text-white font-semibold truncate max-w-[150px]">{item.title}</p>
                                    <p className="text-indigo-300 text-xs">Issue: {item.issue}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">{item.publisher} ({item.year})</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-yellow-400">{item.grade}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{item.dateAdded?.toDate().toLocaleDateString() || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center p-10 text-gray-500 italic bg-gray-800 rounded-xl">
                The final inventory is empty. Complete scanning and grading in the Staging Area, then click "Send to Inventory" to populate this table and assign SKUs.
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
