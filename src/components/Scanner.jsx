// src/components/Scanner.jsx
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; 
import { parseComicBarcode } from '../utils/barcodeParser';
import { addComicToInventory, addComicToStaging, fetchMetadataFromCloud, processImageForMetadata } from '../services/comicService'; 
import { useAuth } from '../context/AuthContext'; 
import { COMIC_GRADES, DEFAULT_COMIC_INPUTS } from '../data/constants'; // 💡 NEW: Import Constants


const Scanner = () => {
  const { currentUser } = useAuth(); 
  
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState('');
  const [scannedComicData, setScannedComicData] = useState(null); 
  // Initialize user inputs using the imported default values
  const [userInputs, setUserInputs] = useState(DEFAULT_COMIC_INPUTS); 
  
  const [imageFile, setImageFile] = useState(null);
  const [mode, setMode] = useState('barcode'); 
  const [isDirectBarcode, setIsDirectBarcode] = useState(false); 


  // --- HANDLERS FOR BARCODE SCAN FLOW ---
  const handleBarcodeScan = async () => {
    setStatus('Processing barcode and initiating lookup...');
    setScannedComicData(null);
    
    // PASS THE DIRECT BARCODE CHECK STATE
    const parsedData = parseComicBarcode(inputCode, isDirectBarcode); 
    if (!parsedData) {
      setStatus('Invalid Comic Barcode.');
      return;
    }
    
    const result = await fetchMetadataFromCloud(
      parsedData.titleCode, 
      parsedData.issueNumber,
      parsedData.coverVariant 
    );

    let metadata = null;
    if (result.status === 'success' && result.metadata) {
        metadata = result.metadata;
        setStatus('Metadata retrieved! Confirm details below.');
    } else {
        setStatus(`Lookup failed: ${result.message || 'Check connection or barcode.'}`);
    }
    
    const fullData = { 
      barcodeData: parsedData, 
      metadata: metadata,
      userInputs: userInputs
    };
    setScannedComicData(fullData);
  };
  
  // --- HANDLERS FOR AI IMAGE FLOW ---
  const handleImageRecognition = async () => {
    if (!imageFile) return setStatus('Please select an image file first.');
    
    setStatus('Uploading image and running AI analysis...');
    setScannedComicData(null);

    // PLACEMAKER: Conversion/Upload logic needed here
    const imageDataPlaceholder = "base64_encoded_image_or_url"; 
    
    const result = await processImageForMetadata(imageDataPlaceholder); 

    let metadata = null;
    if (result.status === 'success' && result.metadata) {
        metadata = result.metadata;
        setStatus('AI metadata retrieved! Confirm details below. (Will be saved to STAGING)');
    } else {
        setStatus(`AI Lookup failed: ${result.message || 'Check image quality or try barcode scan.'}`);
    }

    const fullData = { 
      barcodeData: { // Placeholder barcode data structure since there was no scan
        raw: 'AI-GENERATED', 
        publisherCode: metadata?.details.publisher_name || 'TBD',
        issueNumber: metadata?.details.issue_number || 'TBD',
      }, 
      metadata: metadata,
      userInputs: userInputs
    };
    setScannedComicData(fullData);
  };


  // --- COMMON SAVE HANDLER (CRITICAL LOGIC) ---
  const handleConfirmSave = async () => {
    if (!scannedComicData || !currentUser) return;
    
    setStatus('Finalizing save...');

    const saveFunction = scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION'
      ? addComicToStaging 
      : addComicToInventory; 

    const collectionName = saveFunction === addComicToStaging ? 'staging' : 'inventory';
    
    const result = await saveFunction(currentUser.uid, {
        barcodeData: scannedComicData.barcodeData,
        metadata: scannedComicData.metadata,
        userInputs: userInputs
    });
    
    if (result.success) {
      setStatus(`Successfully added issue to ${collectionName} collection! ID: ${result.id}`);
      setScannedComicData(null); 
      setInputCode('');
      setImageFile(null);
      setIsDirectBarcode(false); 
      setUserInputs(DEFAULT_COMIC_INPUTS); // Reset user inputs
    } else {
      setStatus(`Error saving to ${collectionName} database.`);
    }
  };
  
  const handleCancel = () => { 
    setScannedComicData(null); 
    setStatus('Lookup canceled.');
    setInputCode('');
    setImageFile(null);
    setIsDirectBarcode(false);
    setUserInputs(DEFAULT_COMIC_INPUTS);
  }
  
  const handleSignOut = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign out error:", error);
    }
  }

  const handleUserInput = (e) => {
    const { name, value } = e.target;
    setUserInputs(prev => ({ ...prev, [name]: value }));
  };

  // Only render content if authenticated
  if (!currentUser) return null; 

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleSignOut} style={{ float: 'right', backgroundColor: 'red', color: 'white' }}>Log Out</button>
      <h2>Comic Inventory Scanner</h2>
      <p>Logged in as: {currentUser.email}</p> 
      
      {/* MODE TOGGLE */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={() => { setMode('barcode'); setScannedComicData(null); setStatus(''); }}
          style={{ backgroundColor: mode === 'barcode' ? 'green' : 'gray', color: 'white' }}
        >
          Barcode Scan
        </button>
        <button 
          onClick={() => { setMode('image'); setScannedComicData(null); setStatus(''); }}
          style={{ backgroundColor: mode === 'image' ? 'green' : 'gray', color: 'white', marginLeft: '10px' }}
        >
          AI Image Recognition
        </button>
      </div>

      {/* STEP 1: INPUT BASED ON MODE */}
      {!scannedComicData && (
        <div style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px' }}>
          {mode === 'barcode' ? (
            <div>
              <h4>Scan Barcode (Newstand/Direct Barcode)</h4>
              <input 
                type="text" 
                placeholder="Enter full 17-digit barcode" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              
              <div style={{ margin: '10px 0' }}>
                <input
                  type="checkbox"
                  id="directBarcode"
                  checked={isDirectBarcode}
                  onChange={(e) => setIsDirectBarcode(e.target.checked)}
                />
                <label htmlFor="directBarcode" style={{ marginLeft: '5px' }}>
                  **Barcode has "DIRECT EDITION" text**
                </label>
              </div>
              
              <button onClick={handleBarcodeScan} disabled={!inputCode}>
                Scan & Lookup
              </button>
            </div>
          ) : (
            <div>
              <h4>Upload Cover (Direct Edition Review)</h4>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
              <button onClick={handleImageRecognition} disabled={!imageFile}>
                Run AI & Lookup
              </button>
              <p style={{ marginTop: '5px', fontSize: 'small', color: 'gray' }}>
                AI recognized comics go to staging for review.
              </p>
            </div>
          )}
        </div>
      )}

      <p style={{ color: status.includes('Error') ? 'red' : 'blue' }}>{status}</p>

      {/* STEP 2: CONFIRMATION CARD */}
      {scannedComicData && (
        <div style={{ border: scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? '2px solid orange' : '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Review & Confirm Comic Details</h3>
          
          <p style={{ fontWeight: 'bold', color: scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? 'orange' : 'green' }}>
            Data Source: {scannedComicData.metadata?.details.imageSource}
          </p>

          <p><strong>Unique ID:</strong> {scannedComicData.metadata?.details.unique_inventory_id || 'N/A'}</p>
          <p><strong>Series Title:</strong> {scannedComicData.metadata?.details.series_title || 'TITLE NOT FOUND'}</p>
          <p><strong>Issue / Variant:</strong> #{scannedComicData.barcodeData.issueNumber}, Cover {scannedComicData.barcodeData.coverVariant}</p>
          
          <hr/>
          
          {/* User Input Fields: Grade (using constants) */}
          <label htmlFor="condition_grade">Grade:</label>
          <select 
            id="condition_grade"
            name="condition_grade"
            value={userInputs.condition_grade}
            onChange={handleUserInput}
            style={{ marginLeft: '10px' }}
          >
            {COMIC_GRADES.map(grade => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
          <br/>
          
          {/* User Input Fields: Value */}
          <label htmlFor="my_value">My Value ($):</label>
          <input 
            type="number" 
            id="my_value"
            name="my_value"
            value={userInputs.my_value}
            onChange={handleUserInput}
            style={{ marginLeft: '10px', width: '100px' }}
          />
          
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleConfirmSave} disabled={status.includes('Finalizing')}>
              Confirm Save to {scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? 'STAGING' : 'INVENTORY'}
            </button>
            <button onClick={handleCancel} style={{ marginLeft: '10px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;