'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import Header from '@/components/layout/Header';
import ColumnMappingDialog from '@/components/upload/ColumnMappingDialog';
import DataPreview from '@/components/upload/DataPreview';
import { supabase } from '@/lib/supabase';
import { useCollection } from '@/contexts/CollectionContext';

interface ParsedData {
  columns: string[];
  rows: any[];
}

export default function UploadCollectionPage() {
  const { collection, loading, error: collectionError, fetchCollection } = useCollection();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedData, setTransformedData] = useState<any[] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const parseFile = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'csv') {
        Papa.parse(file, {
          complete: (results) => {
            const columns = results.data[0] as string[];
            const rows = results.data.slice(1);
            resolve({ columns, rows });
          },
          error: (error) => {
            reject(new Error(`Error parsing CSV: ${error.message}`));
          },
          header: false,
        });
      } else if (fileType === 'xlsx') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            const columns = jsonData[0] as string[];
            const rows = jsonData.slice(1);
            resolve({ columns, rows });
          } catch (error) {
            reject(new Error('Error parsing Excel file'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === 'json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              const columns = Object.keys(jsonData[0]);
              resolve({ columns, rows: jsonData });
            } else {
              reject(new Error('Invalid JSON format'));
            }
          } catch (error) {
            reject(new Error('Error parsing JSON file'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setError(null);

      try {
        const data = await parseFile(file);
        setParsedData(data);
        setIsDialogOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error processing file');
        setParsedData(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    multiple: false,
  });

  const handleMappingConfirm = (mappings: Record<string, string>) => {
    if (!parsedData || !collection) return;

    console.log('Mappings:', mappings);
    console.log('Parsed data rows:', parsedData.rows);

    // Transform the data based on mappings and add required fields
    const transformed = parsedData.rows.map((row, index) => {
      // Check if the row is empty
      const hasData = Object.values(row).some(value => 
        value !== undefined && value !== null && value !== ''
      );
      
      if (!hasData) {
        console.log(`Empty row ${index + 1}, using placeholder values`);
        return {
          collection_id: collection.id,
          title: `Untitled Coin ${index + 1}`,
          year: new Date().getFullYear(), // Current year as placeholder
          images: [],
        };
      }

      // First pass to get all values
      const rawValues: Record<string, any> = {};
      Object.entries(mappings).forEach(([targetCol, sourceCol]) => {
        const sourceIndex = parsedData.columns.indexOf(sourceCol);
        if (sourceIndex !== -1) {
          rawValues[targetCol] = row[sourceIndex];
        }
      });

      // Set default values for unmapped fields
      if (!mappings.purchase_date) {
        rawValues.purchase_date = new Date().toISOString().split('T')[0];
        console.log(`Row ${index + 1}: No date column mapped, using today's date`);
      }

      // Initialize transformed row with collection ID and default date
      const transformedRow: Record<string, any> = {
        collection_id: collection.id,
        images: [], // Initialize empty images array
        purchase_date: rawValues.purchase_date || new Date().toISOString().split('T')[0], // Ensure date is always set
      };
      
      // Get additional fields for title construction
      const seriesIndex = parsedData.columns.indexOf('series');
      const series = seriesIndex !== -1 ? row[seriesIndex] : '';
      const featuresIndex = parsedData.columns.indexOf('features');
      const features = featuresIndex !== -1 ? row[featuresIndex] : '';
      const countryIndex = parsedData.columns.indexOf('country');
      const country = countryIndex !== -1 ? row[countryIndex] : '';
      const regionIndex = parsedData.columns.indexOf('region');
      const region = regionIndex !== -1 ? row[regionIndex] : '';
      
      // Second pass to transform values with all context available
      Object.entries(mappings).forEach(([targetCol, sourceCol]) => {
        const sourceIndex = parsedData.columns.indexOf(sourceCol);
        if (sourceIndex !== -1 || targetCol === 'purchase_date') {
          let value = rawValues[targetCol];
          
          // Skip purchase_date as it's already handled
          if (targetCol === 'purchase_date') {
            return;
          }

          console.log(`Transforming ${targetCol}: ${value}`);
          
          // Handle title field
          if (targetCol === 'title') {
            if (!value || typeof value !== 'string' || !value.trim()) {
              // Try to construct title from other fields first
              const titleParts = [];
              
              // Add year if available
              if (rawValues.year) titleParts.push(rawValues.year);
              
              // Add series if available
              if (series) titleParts.push(series);
              
              // Add region/state info if available
              if (region && region !== 'Americas' && region !== 'Europe' && region !== 'Asia') {
                if (region.startsWith('50 States')) {
                  // Extract state name from features or use region
                  const state = features || region.replace('50 States >', '').trim();
                  titleParts.push(state);
                } else {
                  titleParts.push(region);
                }
              }
              
              // Add features if available and not already included
              if (features && !titleParts.includes(features)) {
                titleParts.push(features);
              }
              
              // Add denomination type
              if (rawValues.denomination) {
                const denomParts = rawValues.denomination.split(' ');
                // Get the last word (e.g., "Cent" from "Common Cent")
                const denomType = denomParts[denomParts.length - 1];
                if (!titleParts.some(part => part.includes(denomType))) {
                  titleParts.push(denomType);
                }
              }
              
              value = titleParts.filter(Boolean).join(' - ');
              
              // If we still can't construct a meaningful title, use a placeholder
              if (!value.trim()) {
                console.log(`Row ${index + 1}: Unable to construct meaningful title, using placeholder`);
                value = `Untitled Coin ${index + 1}`;
              }
            }
            value = value.trim();
          }
          
          // Convert year to integer and validate
          if (targetCol === 'year') {
            if (!value && value !== 0) {
              // Use current year as placeholder for empty year
              value = new Date().getFullYear();
              console.log(`Row ${index + 1}: Using current year as placeholder`);
            } else {
              const yearNum = parseInt(value, 10);
              if (isNaN(yearNum)) {
                value = new Date().getFullYear();
                console.log(`Row ${index + 1}: Invalid year "${value}", using current year as placeholder`);
              } else if (yearNum < 1 || yearNum > new Date().getFullYear()) {
                value = new Date().getFullYear();
                console.log(`Row ${index + 1}: Year out of range ${yearNum}, using current year as placeholder`);
              } else {
                value = yearNum;
              }
            }
          }
          
          // Convert purchase_price to numeric
          if (targetCol === 'purchase_price' && value) {
            const priceNum = parseFloat(value);
            if (isNaN(priceNum)) {
              console.log(`Row ${index + 1}: Invalid purchase price "${value}", setting to null`);
              value = null;
            } else {
              value = priceNum;
            }
          }

          // Convert face_value to numeric
          if (targetCol === 'face_value') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              console.log(`Row ${index + 1}: Invalid face value "${value}", using 0`);
              value = 0;
            } else {
              value = numValue;
            }
          }

          // Handle purchase_date
          if (targetCol === 'purchase_date') {
            if (!value || value === '') {
              // Use today's date as default for missing purchase dates
              value = new Date().toISOString().split('T')[0];
              console.log(`Row ${index + 1}: Missing purchase date, using today's date`);
            } else {
              try {
                // Try to parse the date
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  // If invalid date, use today
                  value = new Date().toISOString().split('T')[0];
                  console.log(`Row ${index + 1}: Invalid date "${value}", using today's date`);
                } else {
                  // Format as YYYY-MM-DD
                  value = date.toISOString().split('T')[0];
                }
              } catch (err) {
                // If date parsing fails, use today
                value = new Date().toISOString().split('T')[0];
                console.log(`Row ${index + 1}: Error parsing date "${value}", using today's date`);
              }
            }
          }
          
          transformedRow[targetCol] = value;
        }
      });
      console.log('Transformed row:', transformedRow);
      return transformedRow;
    });

    setTransformedData(transformed);
    setIsDialogOpen(false);
    setIsPreviewOpen(true);
  };

  const handleImport = async () => {
    if (!transformedData || !collection) return;

    setIsImporting(true);
    setError(null);

    try {
      console.log('Transformed data before import:', transformedData);
      const { error: insertError } = await supabase
        .from('coins')
        .insert(transformedData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Reset state after successful import
      setUploadedFile(null);
      setParsedData(null);
      setTransformedData(null);
      setIsPreviewOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCollection();
      setIsCreateDialogOpen(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating collection');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Upload Collection</h1>
          <Header />
        </div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex-1 bg-[#1e1e1e] text-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Upload Collection</h1>
          <Header />
        </div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-400 mb-4">
            Create your collection to start uploading coins.
          </p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Collection
          </button>
        </div>

        {/* Create Collection Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Create Collection</h2>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
                    placeholder="My Coin Collection"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600 h-24"
                    placeholder="Optional description of your collection"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2
                    ${!newCollectionName.trim() || isCreating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                >
                  {isCreating ? (
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
                      Creating...
                    </>
                  ) : (
                    'Create Collection'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Collection</h1>
          <p className="text-sm text-gray-400 mt-1">
            Uploading to: {collection.name}
          </p>
        </div>
        <Header />
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto mb-8">
        <div
          {...getRootProps()}
          className={`
            bg-[#2a2a2a] rounded-lg p-12
            border-2 border-dashed border-gray-600
            cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-[#2d3748]' : 'hover:border-gray-500'}
          `}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-300 mb-2">
              Drag and drop your collection file here
            </p>
            <p className="text-gray-400">or</p>
            <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Choose File
            </button>
            {uploadedFile && (
              <p className="mt-4 text-sm text-gray-400">
                Selected file: {uploadedFile.name}
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-red-400">
                Error: {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File Format Information */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#2a2a2a] rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Supported Formats</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• CSV files (.csv)</li>
              <li>• Excel files (.xlsx)</li>
              <li>• JSON files (.json)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">File Format Requirements</h2>
            <p className="text-gray-300 mb-2">Your file should include the following columns:</p>
            <ul className="space-y-2 text-gray-300">
              <li>• Title (required) - A descriptive name for your coin (e.g., "US State Quarter - Colorado")</li>
              <li>• Year (required) - The year the coin was minted</li>
              <li>• Denomination - e.g., "Quarter", "Penny", "Dollar"</li>
              <li>• Mint Mark - e.g., "D" for Denver, "S" for San Francisco</li>
              <li>• Grade - The coin's condition grade</li>
              <li>• Purchase Price - How much you paid for the coin</li>
              <li>• Purchase Date - When you acquired the coin</li>
              <li>• Notes - Any additional information about the coin</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Column Mapping Dialog */}
      {parsedData && (
        <ColumnMappingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleMappingConfirm}
          sourceColumns={parsedData.columns}
        />
      )}

      {/* Data Preview */}
      {transformedData && (
        <DataPreview
          data={transformedData}
          isOpen={isPreviewOpen}
          onConfirm={handleImport}
          onCancel={() => setIsPreviewOpen(false)}
          isLoading={isImporting}
        />
      )}
    </div>
  );
} 