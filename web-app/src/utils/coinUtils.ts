// Utility functions for coin-related operations

export const getStandardFaceValue = (denomination: string): number | null => {
  if (!denomination) return null;
  
  const denom = denomination.toLowerCase().trim();
  
  // US coin standard face values
  const standardValues: { [key: string]: number } = {
    // Common denominations
    'cent': 0.01,
    'penny': 0.01,
    'nickel': 0.05,
    'dime': 0.10,
    'quarter': 0.25,
    'half dollar': 0.50,
    'dollar': 1.00,
    'silver dollar': 1.00,
    
    // Specific coin types
    'lincoln cent': 0.01,
    'lincoln penny': 0.01,
    'jefferson nickel': 0.05,
    'roosevelt dime': 0.10,
    'washington quarter': 0.25,
    'kennedy half dollar': 0.50,
    'eisenhower dollar': 1.00,
    'susan b anthony dollar': 1.00,
    'sacagawea dollar': 1.00,
    'presidential dollar': 1.00,
    'american eagle': 1.00,
    
    // State quarters
    'state quarter': 0.25,
    'america the beautiful quarter': 0.25,
    'american women quarter': 0.25,
    
    // Commemorative but with standard values
    'bicentennial quarter': 0.25,
    'bicentennial half dollar': 0.50,
    'bicentennial dollar': 1.00,
  };
  
  // Direct match
  if (standardValues[denom]) {
    return standardValues[denom];
  }
  
  // Partial matching for common patterns
  if (denom.includes('cent') || denom.includes('penny')) return 0.01;
  if (denom.includes('nickel')) return 0.05;
  if (denom.includes('dime')) return 0.10;
  if (denom.includes('quarter')) return 0.25;
  if (denom.includes('half dollar')) return 0.50;
  if (denom.includes('dollar')) return 1.00;
  
  return null;
};

export const getDisplayValue = (value: number | null, fallback: string = 'Not specified'): string => {
  if (value === null || value === undefined) return fallback;
  return value.toString();
};

export const getDisplayCurrency = (value: number | null, denomination?: string): string => {
  if (value !== null && value !== undefined) {
    return `$${value.toFixed(2)}`;
  }
  
  // Try to auto-populate from denomination
  if (denomination) {
    const standardValue = getStandardFaceValue(denomination);
    if (standardValue !== null) {
      return `$${standardValue.toFixed(2)}`;
    }
  }
  
  return 'Not specified';
};

export const getDisplayGrade = (grade: string | null | undefined): string => {
  if (!grade || grade.trim() === '') return 'Not graded';
  return grade;
};

export const getDisplayMintMark = (mintMark: string | null | undefined): string => {
  if (!mintMark || mintMark.trim() === '') return 'No mint mark';
  return mintMark;
};

export const formatSortableValue = (value: any): string | number => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  return String(value).toLowerCase();
}; 