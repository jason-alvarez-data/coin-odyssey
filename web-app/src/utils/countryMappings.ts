// Shared country name mappings for standardization across components
export const countryNameMappings: { [key: string]: string } = {
  'United States of America': 'United States',
  'USA': 'United States',
  'US': 'United States',
  'UNITED STATES': 'United States',
  'United Kingdom': 'UK',
  'Great Britain': 'UK',
  'England': 'UK',
  'Russian Federation': 'Russia',
  'People\'s Republic of China': 'China',
  'PRC': 'China',
};

export const getStandardizedCountryName = (countryName: string): string => {
  if (!countryName) return '';
  
  const trimmed = countryName.trim();
  
  // Check for exact matches first
  if (countryNameMappings[trimmed]) {
    return countryNameMappings[trimmed];
  }
  
  // Check for case-insensitive matches
  const lowerInput = trimmed.toLowerCase();
  const matchedEntry = Object.entries(countryNameMappings).find(
    ([key]) => key.toLowerCase() === lowerInput
  );
  
  return matchedEntry ? matchedEntry[1] : trimmed;
}; 