"use client";

import { useState, useEffect, useRef } from 'react';
import { CoinSeries, getSeriesByCountryAndDenomination, COIN_SERIES } from '@/types/series';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SeriesAutocompleteProps {
  country?: string;
  denomination?: string;
  value?: string;
  onChange: (seriesName: string) => void;
  className?: string;
}

export default function SeriesAutocomplete({
  country,
  denomination,
  value,
  onChange,
  className = ''
}: SeriesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CoinSeries[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<CoinSeries[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update input when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // Filter suggestions based on country and denomination
  useEffect(() => {
    if (country && denomination) {
      const filtered = getSeriesByCountryAndDenomination(country, denomination);
      setAllSuggestions(filtered);
      if (inputValue) {
        filterSuggestions(inputValue, filtered);
      } else {
        setSuggestions(filtered);
      }
    } else {
      setAllSuggestions(COIN_SERIES);
      if (inputValue) {
        filterSuggestions(inputValue, COIN_SERIES);
      } else {
        setSuggestions(COIN_SERIES.slice(0, 10)); // Show first 10 series
      }
    }
  }, [country, denomination]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterSuggestions = (query: string, seriesList: CoinSeries[] = allSuggestions) => {
    const lowerQuery = query.toLowerCase();
    const filtered = seriesList.filter(series =>
      series.name.toLowerCase().includes(lowerQuery) ||
      series.shortName.toLowerCase().includes(lowerQuery) ||
      series.description.toLowerCase().includes(lowerQuery)
    );
    setSuggestions(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim()) {
      filterSuggestions(newValue);
      setIsOpen(true);
    } else {
      setSuggestions(allSuggestions.length > 0 ? allSuggestions : COIN_SERIES.slice(0, 10));
      setIsOpen(true);
    }
  };

  const handleSelectSeries = (series: CoinSeries) => {
    setInputValue(series.name);
    onChange(series.name);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!inputValue && allSuggestions.length > 0) {
      setSuggestions(allSuggestions);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="e.g., American Women Quarters"
          className={className}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onChange('');
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-300"
            >
              ×
            </button>
          )}
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((series) => (
            <button
              key={series.id}
              type="button"
              onClick={() => handleSelectSeries(series)}
              className="w-full text-left px-4 py-3 hover:bg-[#353535] border-b border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white">{series.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{series.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{series.country}</span>
                    <span>•</span>
                    <span>{series.denomination}</span>
                    <span>•</span>
                    <span>{series.startYear}-{series.endYear}</span>
                    <span>•</span>
                    <span className="capitalize">{series.category}</span>
                  </div>
                </div>
                {series.specificCoins.length > 0 && (
                  <div className="ml-2 px-2 py-1 bg-[#1e1e1e] rounded text-xs text-gray-400">
                    {series.specificCoins.length} coins
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-lg px-4 py-3 text-gray-400 text-sm">
          No series found matching "{inputValue}"
        </div>
      )}

      {/* Helper text */}
      {!isOpen && country && denomination && allSuggestions.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          {allSuggestions.length} series available for {denomination} from {country}
        </div>
      )}
    </div>
  );
}
