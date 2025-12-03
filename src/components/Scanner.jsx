// src/components/Scanner.jsx
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; 
import { parseComicBarcode } from '../utils/barcodeParser';
// 👇 CRITICAL REVISION: Import the new addComicToStaging function
import { 
  addComicToInventory, 
  addComicToStaging, 
  fetchMetadataFromCloud, 
  processImageForMetadata 
} from '../services/comicService'; 
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
    
    // NOTE: The coverVariant is now implicitly part of the barcode data
    const result = await fetchMetadataFromCloud(
      parsedData.titleCode, 
      parsedData.issueNumber,
      parsedData.coverVariant 
    );

    let metadata = null;
    if (result.status === 'success' && result.metadata) {
        metadata = result.metadata;
        metadata.details.imageSource = 'BARCODE_SCAN'; // Tag the source
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
    
    // NOTE: This call relies on the processImageForMetadata wrapper we fixed earlier
    const result = await processImageForMetadata(imageDataPlaceholder); 

    let metadata = null;
    if (result.status === 'success' && result.metadata) {
        metadata = result.metadata;
        metadata.details.imageSource = 'AI_RECOGNITION'; // Tag the source
        setStatus('AI metadata retrieved! Confirm details below. (Will be saved to STAGING)');
    } else {
        setStatus(`AI Lookup failed: ${result.message || 'Check image quality or try barcode scan.'}`);
    }

    const fullData = { 
      barcodeData: { // Placeholder barcode data structure since there was no scan
        raw: 'AI-GENERATED', 
        publisherCode: metadata?.details.publisher_name.substring(0, 3).toUpperCase() || 'TBD',
        issueNumber: metadata?.details.issue_number || 'TBD',
        coverVariant: 'A', // Default variant for AI
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

    // Determine save location based on the imageSource tag added above
    const isAIRecognition = scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION';
    const saveFunction = isAIRecognition ? addComicToStaging : addComicToInventory; 
    const collectionName = isAIRecognition ? 'staging' : 'inventory';
    
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
      <button onClick={