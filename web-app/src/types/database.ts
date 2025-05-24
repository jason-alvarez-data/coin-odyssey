export interface Collection {
    id: string
    user_id: string
    name: string
    description?: string
    created_at: string
    updated_at: string
  }
  
  export interface Coin {
    id: string
    collection_id: string
    denomination: string
    year: number
    mint_mark?: string
    grade?: string
    purchase_price?: number
    purchase_date?: string
    notes?: string
    created_at: string
    updated_at: string
  }
  
  export interface CollectionShare {
    collection_id: string
    shared_with_user_id: string
    permission_level: 'view' | 'edit'
    created_at: string
  }