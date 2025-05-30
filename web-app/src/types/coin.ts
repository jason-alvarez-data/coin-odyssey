export interface Coin {
  id: string;
  name: string;
  title: string;
  year: number;
  mintMark: string | null;
  grade: string | null;
  faceValue: number | null;
  purchasePrice: number | null;
  currentMarketValue: number | null;
  lastValueUpdate: string | null;
  pcgsId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  collectionId: string;
  denomination: string;
  purchaseDate: string | null;
  personalValue: number | null;
  lastAppraisalValue: number | null;
  lastAppraisalDate: string | null;
  mintage: number | null;
  rarityScale: number | null;
  historicalNotes: string | null;
  varietyNotes: string | null;
  notes: string | null;
}

export interface CoinValueHistory {
  id: string;
  coinId: string;
  marketValue: number;
  valueDate: Date;
  source: string | null;
  createdAt: Date;
}

export type SearchField = 'all' | 'denomination' | 'year' | 'grade' | 'mintMark';

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