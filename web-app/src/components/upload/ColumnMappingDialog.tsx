import { useState, useEffect } from 'react';

interface ColumnMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mappings: Record<string, string>) => void;
  sourceColumns: string[];
}

const targetColumns = [
  { name: 'denomination', label: 'Denomination', required: true },
  { name: 'year', label: 'Year', required: true },
  { name: 'mint_mark', label: 'Mint Mark', required: false },
  { name: 'grade', label: 'Grade', required: false },
  { name: 'purchase_price', label: 'Purchase Price', required: false },
  { name: 'purchase_date', label: 'Purchase Date', required: false },
  { name: 'notes', label: 'Notes', required: false },
];

export default function ColumnMappingDialog({
  isOpen,
  onClose,
  onConfirm,
  sourceColumns,
}: ColumnMappingDialogProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-map columns with exact matches
  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    targetColumns.forEach(({ name }) => {
      const match = sourceColumns.find(
        col => col.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        initialMappings[name] = match;
      }
    });
    setMappings(initialMappings);
  }, [sourceColumns]);

  const handleMappingChange = (targetColumn: string, sourceColumn: string) => {
    setMappings(prev => ({
      ...prev,
      [targetColumn]: sourceColumn,
    }));
  };

  const validateMappings = () => {
    const newErrors: string[] = [];
    targetColumns.forEach(({ name, label, required }) => {
      if (required && !mappings[name]) {
        newErrors.push(`${label} is required`);
      }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConfirm = () => {
    if (validateMappings()) {
      onConfirm(mappings);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Map Columns</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <ul className="text-red-400 text-sm">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {targetColumns.map(({ name, label, required }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mappings[name] || ''}
                  onChange={(e) => handleMappingChange(name, e.target.value)}
                  className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
                >
                  <option value="">Select column</option>
                  {sourceColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirm Mapping
          </button>
        </div>
      </div>
    </div>
  );
} 