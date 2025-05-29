import { useState } from 'react';

interface DataPreviewProps {
  data: any[];
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function DataPreview({ data, isOpen, onConfirm, onCancel, isLoading }: DataPreviewProps) {
  const [previewCount, setPreviewCount] = useState(5);

  if (!isOpen || !data.length) return null;

  const previewData = data.slice(0, previewCount);
  const columns = Object.keys(data[0]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Preview Import Data</h2>
            <p className="text-sm text-gray-400 mt-1">
              Showing {previewCount} of {data.length} records
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                {columns.map((column) => (
                  <th key={column} className="p-3 text-sm font-semibold text-gray-300">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-700 hover:bg-[#353535]"
                >
                  {columns.map((column) => (
                    <td key={column} className="p-3 text-sm text-gray-300">
                      {row[column]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > previewCount && (
          <button
            onClick={() => setPreviewCount(prev => Math.min(prev + 5, data.length))}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
          >
            Show more rows...
          </button>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Importing...
              </>
            ) : (
              'Import Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 