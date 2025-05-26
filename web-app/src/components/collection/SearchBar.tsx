import { SearchField } from '@/types/coin';

interface SearchBarProps {
  searchQuery: string;
  searchField: SearchField;
  onSearchChange: (value: string) => void;
  onFieldChange: (value: SearchField) => void;
}

export default function SearchBar({
  searchQuery,
  searchField,
  onSearchChange,
  onFieldChange,
}: SearchBarProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search coins..."
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      />
      <select
        value={searchField}
        onChange={(e) => onFieldChange(e.target.value as SearchField)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      >
        <option value="all">All Fields</option>
        <option value="title">Title</option>
        <option value="country">Country</option>
        <option value="year">Year</option>
      </select>
    </div>
  );
} 