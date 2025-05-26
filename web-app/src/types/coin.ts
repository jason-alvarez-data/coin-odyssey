export interface Coin {
  id: string;
  collectionId: string;
  denomination: string;
  year: number;
  mintMark: string | null;
  grade: string | null;
  purchasePrice: number;
  purchaseDate: Date;
  notes: string | null;
  images: string[] | null;
}

export type SearchField = 'all' | 'denomination' | 'year' | 'grade';

export type GradeFilter = 
  | ''
  | 'MS-70 to MS-65'
  | 'MS-64 to MS-60'
  | 'AU-58 to AU-50'
  | 'XF-45 to XF-40'
  | 'VF-35 to VF-20'
  | 'F-15 to F-12'
  | 'VG-10 to VG-8'
  | 'G-6 to G-4'
  | 'AG-3 to PR-1';

export type ValueFilter = 
  | ''
  | 'Under $10'
  | '$10 - $50'
  | '$50 - $100'
  | '$100 - $500'
  | 'Over $500'; 