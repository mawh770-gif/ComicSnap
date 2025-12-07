// Folder: src/components
// File: Scanner.jsx
// Version: 1.9
// Date: December 7, 2025

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import { parseComicBarcode } from '../utils/barcodeParser.js';
import { 
  addComicToInventory, 
  addComicToStaging, 
  fetchMetadataFromCloud, 
  processImageForMetadata 
} from '../services/comicService.js'; 
import { COMIC_GRADES, DEFAULT_COMIC_INPUTS } from '../data/constants.js';

// Utility to implement exponential backoff for retries
const callFunctionWithBackoff = async (callable, data, maxRetries = 3, initialDelay = 1000) => {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await callable(data);
            return response; 
        } catch (error) {
            if (i < maxRetries - 1) {
                console.warn(`Function call failed. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            } else {
                throw error; 
            }
        }
    }
};

const Scanner = () => {
    const { currentUser, auth, logout } = useAuth(); 
    
    const [inputCode, setInputCode] = useState('');
    const [status, setStatus] = useState('');
    const [scannedComicData, setScannedComicData] = useState(null); 
    const [userInputs, setUserInputs] = useState(DEFAULT_COMIC_INPUTS); 
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [mode, setMode] = useState('barcode'); 
    const [isDirectBarcode, setIsDirectBarcode] = useState(false); 
    
    // State for loading indicators
    const [manualLoading, setManualLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // Access Firebase Functions
    const functions = useMemo(() => {
        if (!auth.app) return null;
        return getFunctions(auth.app, 'us-central1');
    }, [auth.app]);

    // Converts a File object to a Base64 string
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // 1. Manual Barcode Lookup Handler
    const handleBarcodeScan = useCallback(async (e) => {
        if(e) e.preventDefault();
        
        setStatus('Processing barcode and initiating lookup...');
        setScannedComicData(null);
        setManualLoading(true);
        
        try {
            const parsedData = parseComicBarcode(inputCode, isDirectBarcode); 
            if (!parsedData) {
                setStatus('Invalid Comic Barcode.');
                setManualLoading(false);
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
                metadata.details.imageSource = 'BARCODE_SCAN'; 
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
        } catch (error) {
             console.error("Scan Error:", error);
             setStatus(`Error: ${error.message}`);
        } finally {
            setManualLoading(false);
        }
    }, [inputCode, isDirectBarcode, userInputs]);
    
    // 2. AI Image Analysis Handler
    const handleImageRecognition = useCallback(async (e) => {
        if(e) e.preventDefault();

        if (!imageFile) {
            setStatus('Please select an image file first.');
            return;
        }
        
        setStatus('Uploading image and running AI analysis...');
        setScannedComicData(null);
        setAiLoading(true);

        try {
            const base64Image = await fileToBase64(imageFile);
            const base64Data = base64Image.split(',')[1];
            
            const result = await processImageForMetadata(base64Data, imageFile.type); 
    
            let metadata = null;
            if (result.status === 'success' && result.metadata) {
                metadata = result.metadata;
                metadata.details.imageSource = 'AI_RECOGNITION'; 
                setStatus('AI metadata retrieved! Confirm details below. (Will be saved to STAGING)');
            } else {
                setStatus(`AI Lookup failed: ${result.message || 'Check image quality or try barcode scan.'}`);
            }
    
            const fullData = { 
                barcodeData: { 
                    raw: 'AI-GENERATED', 
                    publisherCode: metadata?.details.publisher_name?.substring(0, 3).toUpperCase() || 'TBD',
                    issueNumber: metadata?.details.issue_number || 'TBD',
                    coverVariant: 'A', 
                }, 
                metadata: metadata,
                userInputs: userInputs
            };
            setScannedComicData(fullData);
        } catch (error) {
            console.error("AI Error:", error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setAiLoading(false);
        }
    }, [imageFile, userInputs]);


    // --- COMMON SAVE HANDLER ---
    const handleConfirmSave = async () => {
        if (!scannedComicData || !currentUser) return;
        
        setStatus('Finalizing save...');

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
            setImagePreviewUrl('');
            setIsDirectBarcode(false); 
            setUserInputs(DEFAULT_COMIC_INPUTS); 
        } else {
            setStatus(`Error saving to ${collectionName} database.`);
        }
    };
    
    const handleCancel = () => { 
        setScannedComicData(null); 
        setStatus('Lookup canceled.');
        setInputCode('');
        setImageFile(null);
        setImagePreviewUrl('');
        setIsDirectBarcode(false);
        setUserInputs(DEFAULT_COMIC_INPUTS);
    }
    
    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }

    const handleUserInput = (e) => {
        const { name, value } = e.target;
        setUserInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setStatus('');
        }
    };

    if (!currentUser) return null; 

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={handleSignOut} style={{ float: 'right', backgroundColor: 'red', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Log Out</button>
            <h2>Comic Inventory Scanner</h2>
            <p>Logged in as: {currentUser.email || 'User'}</p> 
            
            {/* MODE TOGGLE */}
            <div style={{ marginBottom: '15px' }}>
                <button 
                    onClick={() => { setMode('barcode'); setScannedComicData(null); setStatus(''); }}
                    style={{ 
                        backgroundColor: mode === 'barcode' ? 'green' : 'gray', 
                        color: 'white', 
                        padding: '10px 20px', 
                        marginRight: '10px', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
                >
                    Barcode Scan
                </button>
                <button 
                    onClick={() => { setMode('image'); setScannedComicData(null); setStatus(''); }}
                    style={{ 
                        backgroundColor: mode === 'image' ? 'green' : 'gray', 
                        color: 'white', 
                        padding: '10px 20px', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
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
                                style={{ padding: '8px', width: '300px', marginRight: '10px' }}
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
                            
                            <button 
                                onClick={handleBarcodeScan} 
                                disabled={!inputCode || manualLoading}
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                            >
                                {manualLoading ? 'Scanning...' : 'Scan & Lookup'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h4>Upload Cover (Direct Edition Review)</h4>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ marginBottom: '10px' }}
                            />
                            {imagePreviewUrl && (
                                <div style={{ marginBottom: '10px' }}>
                                    <img src={imagePreviewUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '300px' }} />
                                </div>
                            )}
                            <button 
                                onClick={handleImageRecognition} 
                                disabled={!imageFile || aiLoading}
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                            >
                                {aiLoading ? 'Analyzing...' : 'Run AI & Lookup'}
                            </button>
                            <p style={{ marginTop: '5px', fontSize: 'small', color: 'gray' }}>
                                AI recognized comics go to staging for review.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <p style={{ color: status.includes('Error') ? 'red' : 'blue', fontWeight: 'bold' }}>{status}</p>

            {/* STEP 2: CONFIRMATION CARD */}
            {scannedComicData && (
                <div style={{ border: scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? '2px solid orange' : '1px solid #ccc', padding: '15px', borderRadius: '8px', maxWidth: '600px' }}>
                    <h3>Review & Confirm Comic Details</h3>
                    
                    <p style={{ fontWeight: 'bold', color: scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? 'orange' : 'green' }}>
                        Data Source: {scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? 'AI RECOGNITION (STAGING)' : 'BARCODE SCAN (INVENTORY)'}
                    </p>

                    <p>
                        <strong>Base Code:</strong> {scannedComicData.barcodeData.publisherCode} {scannedComicData.barcodeData.titleCode} {scannedComicData.barcodeData.issueNumber} {scannedComicData.barcodeData.coverVariant}
                    </p>
                    <p><strong>Series Title:</strong> {scannedComicData.metadata?.details.series_title || 'TITLE NOT FOUND'}</p>
                    <p><strong>Issue / Variant:</strong> #{scannedComicData.barcodeData.issueNumber}, Cover {scannedComicData.barcodeData.coverVariant}</p>
                    
                    <hr/>
                    
                    {/* User Input Fields: Grade */}
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="condition_grade">Grade:</label>
                        <select 
                            id="condition_grade"
                            name="condition_grade"
                            value={userInputs.condition_grade}
                            onChange={handleUserInput}
                            style={{ marginLeft: '10px', padding: '5px' }}
                        >
                            {COMIC_GRADES.map(grade => (
                                <option key={grade.value} value={grade.value}>
                                    {grade.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* User Input Fields: Value */}
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="my_value">My Value ($):</label>
                        <input 
                            type="number" 
                            id="my_value"
                            name="my_value"
                            value={userInputs.my_value}
                            onChange={handleUserInput}
                            style={{ marginLeft: '10px', width: '100px', padding: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginTop: '15px' }}>
                        <button 
                            onClick={handleConfirmSave} 
                            disabled={status.includes('Finalizing')}
                            style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                        >
                            Confirm Save to {scannedComicData.metadata?.details.imageSource === 'AI_RECOGNITION' ? 'STAGING' : 'INVENTORY'}
                        </button>
                        <button 
                            onClick={handleCancel} 
                            style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;