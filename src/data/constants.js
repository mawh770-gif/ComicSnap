// src/data/constants.js

/**
 * Detailed professional grading scale for comic books.
 * Used for user input dropdowns (value is stored, label is displayed).
 */
export const COMIC_GRADES = [
    { value: 'Unassigned', label: 'Unassigned Grade' },
    { value: '10.0', label: '10.0 Gem Mint (GM)' },
    { value: '9.8', label: '9.8 Near Mint/Mint (NM/M)' },
    { value: '9.6', label: '9.6 Near Mint Plus (NM+)' },
    { value: '9.4', label: '9.4 Near Mint (NM)' },
    { value: '9.2', label: '9.2 Near Mint Minus (NM-)' },
    { value: '9.0', label: '9.0 Very Fine/Near Mint (VF/NM)' },
    { value: '8.5', label: '8.5 Very Fine Plus (VF+)' },
    { value: '8.0', label: '8.0 Very Fine (VF)' },
    { value: '7.5', label: '7.5 Very Fine Minus (VF-)' },
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

/**
 * System-specific variant codes used to trigger specific metadata logic.
 */
export const VARIANT_CODES = {
    // D0 is the special code for Direct Market Editions (either barcode-less or with Direct text)
    'D0': 'Direct Edition',
};

/**
 * Default values for initializing a new comic entry.
 */
export const DEFAULT_COMIC_INPUTS = {
    // Set default grade to the string value '9.4' from the COMIC_GRADES array of objects
    condition_grade: '9.4', 
    my_value: '',
    storage_box: 'Unsorted'
};