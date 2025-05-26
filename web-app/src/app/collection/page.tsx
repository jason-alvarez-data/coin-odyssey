"use client";

import { useState } from 'react';
import { SearchField, GradeFilter, ValueFilter } from '@/types/coin';
import CollectionTable from '@/components/collection/CollectionTable';
import SearchBar from '@/components/collection/SearchBar';
import FilterControls from '@/components/collection/FilterControls';

export default function CollectionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('');
  const [valueFilter, setValueFilter] = useState<ValueFilter>('');

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">My Collection</h1>
      
      <div className="space-y-6">
        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar 
            searchQuery={searchQuery}
            searchField={searchField}
            onSearchChange={setSearchQuery}
            onFieldChange={setSearchField}
          />
          <FilterControls
            gradeFilter={gradeFilter}
            valueFilter={valueFilter}
            onGradeChange={setGradeFilter}
            onValueChange={setValueFilter}
          />
        </div>

        {/* Collection Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <CollectionTable 
            searchQuery={searchQuery}
            searchField={searchField}
            gradeFilter={gradeFilter}
            valueFilter={valueFilter}
          />
        </div>
      </div>
    </div>
  );
} 