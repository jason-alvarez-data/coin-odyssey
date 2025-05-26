import { GradeFilter, ValueFilter } from '@/types/coin';

interface FilterControlsProps {
  gradeFilter: GradeFilter;
  valueFilter: ValueFilter;
  onGradeChange: (value: GradeFilter) => void;
  onValueChange: (value: ValueFilter) => void;
}

export default function FilterControls({
  gradeFilter,
  valueFilter,
  onGradeChange,
  onValueChange,
}: FilterControlsProps) {
  return (
    <div className="flex gap-2">
      <select
        value={gradeFilter}
        onChange={(e) => onGradeChange(e.target.value as GradeFilter)}
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      >
        <option value="">All Grades</option>
        <option value="MS-70 to MS-65">MS-70 to MS-65 (Gem Mint)</option>
        <option value="MS-64 to MS-60">MS-64 to MS-60 (Mint State)</option>
        <option value="AU-58 to AU-50">AU-58 to AU-50 (About Uncirculated)</option>
        <option value="XF-45 to XF-40">XF-45 to XF-40 (Extremely Fine)</option>
        <option value="VF-35 to VF-20">VF-35 to VF-20 (Very Fine)</option>
        <option value="F-15 to F-12">F-15 to F-12 (Fine)</option>
        <option value="VG-10 to VG-8">VG-10 to VG-8 (Very Good)</option>
        <option value="G-6 to G-4">G-6 to G-4 (Good)</option>
        <option value="AG-3 to PR-1">AG-3 to PR-1 (About Good to Poor)</option>
      </select>

      <select
        value={valueFilter}
        onChange={(e) => onValueChange(e.target.value as ValueFilter)}
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
      >
        <option value="">All Values</option>
        <option value="Under $10">Under $10</option>
        <option value="$10 - $50">$10 - $50</option>
        <option value="$50 - $100">$50 - $100</option>
        <option value="$100 - $500">$100 - $500</option>
        <option value="Over $500">Over $500</option>
      </select>
    </div>
  );
} 