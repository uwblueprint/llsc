// Helper to format array of strings (e.g. pronouns)
export const formatArray = (arr?: string[] | null) => {
  if (!arr || arr.length === 0) return 'N/A';
  return arr.join(', ');
};

// Helper to capitalize first letter of each word
export const capitalizeWords = (str?: string | null) => {
  if (!str) return 'N/A';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Diagnosis options
export const DIAGNOSIS_OPTIONS: string[] = [
  'Unknown',
  'Acute Myeloid Leukemia',
  'Acute Lymphoblastic Leukemia',
  'Acute Promyelocytic Leukemia',
  'Mixed Phenotype Leukemia',
  'Chronic Lymphocytic Leukemia/Small Lymphocytic Lymphoma',
  'Chronic Myeloid Leukemia',
  'Hairy Cell Leukemia',
  'Myeloma/Multiple Myeloma',
  "Hodgkin's Lymphoma",
  "Indolent/Low Grade Non-Hodgkin's Lymphoma",
];
