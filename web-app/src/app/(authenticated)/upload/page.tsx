'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, Loader2 } from 'lucide-react';

import ColumnMappingDialog from '@/components/upload/ColumnMappingDialog';
import DataPreview from '@/components/upload/DataPreview';
import { supabase } from '@/lib/supabase';
import { useCollection } from '@/contexts/CollectionContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ParsedData {
  columns: string[];
  rows: unknown[];
}

export default function UploadCollectionPage() {
  const { collection, loading, error: collectionError, fetchCollection } = useCollection();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedData, setTransformedData] = useState<unknown[] | null>(null);
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
      if (!Array.isArray(row)) return {};
      const hasData = row.some(value =>
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
      const rawValues: Record<string, unknown> = {};
      Object.entries(mappings).forEach(([targetCol, sourceCol]) => {
        const sourceIndex = parsedData.columns.indexOf(sourceCol);
        if (sourceIndex !== -1) {
          rawValues[targetCol] = (row as unknown[])[sourceIndex];
        }
      });

      // Set default values for unmapped fields
      if (!mappings.purchase_date) {
        rawValues.purchase_date = new Date().toISOString().split('T')[0];
        console.log(`Row ${index + 1}: No date column mapped, using today's date`);
      }

      // Initialize transformed row with collection ID and default date
      const transformedRow: Record<string, unknown> = {
        collection_id: collection.id,
        images: [], // Initialize empty images array
        purchase_date: rawValues.purchase_date || new Date().toISOString().split('T')[0], // Ensure date is always set
      };

      // Get additional fields for title construction
      const seriesIndex = parsedData.columns.indexOf('series');
      const series = seriesIndex !== -1 ? (row as unknown[])[seriesIndex] : '';
      const featuresIndex = parsedData.columns.indexOf('features');
      const features = featuresIndex !== -1 ? (row as unknown[])[featuresIndex] : '';
      const countryIndex = parsedData.columns.indexOf('country');
      const country = countryIndex !== -1 ? (row as unknown[])[countryIndex] : '';
      const regionIndex = parsedData.columns.indexOf('region');
      const region = regionIndex !== -1 ? (row as unknown[])[regionIndex] : '';

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
              if (rawValues.year) titleParts.push(String(rawValues.year));

              // Add series if available
              if (series) titleParts.push(String(series));

              // Add region/state info if available
              if (region && typeof region === 'string' && region !== 'Americas' && region !== 'Europe' && region !== 'Asia') {
                titleParts.push(region);
              }
              // Add country if available
              if (country) titleParts.push(String(country));
              // Add features if available
              if (features) titleParts.push(String(features));
              value = titleParts.join(' - ');
            }
          }

          // If value is a string, trim it
          if (typeof value === 'string') {
            value = value.trim();
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Upload Collection</h1>
        </div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">
            Create your collection to start uploading coins.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Collection
          </Button>
        </div>

        {/* Create Collection Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
              <DialogDescription>
                Create a new collection to organize your coins.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="collection-name"
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="My Coin Collection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection-description">Description</Label>
                <Textarea
                  id="collection-description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Optional description of your collection"
                  className="h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Collection'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Collection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Uploading to: {collection.name}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto mb-8">
        <div
          {...getRootProps()}
          className={`
            rounded-xl border-2 border-dashed p-12
            cursor-pointer transition-colors
            bg-card text-card-foreground
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}
          `}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <div className="mb-4">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-lg text-foreground mb-2">
              Drag and drop your collection file here
            </p>
            <p className="text-muted-foreground">or</p>
            <Button className="mt-2">
              Choose File
            </Button>
            {uploadedFile && (
              <p className="mt-4 text-sm text-muted-foreground">
                Selected file: {uploadedFile.name}
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-destructive">
                Error: {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File Format Information */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-card-foreground">
              <li>&bull; CSV files (.csv)</li>
              <li>&bull; Excel files (.xlsx)</li>
              <li>&bull; JSON files (.json)</li>
            </ul>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">File Format Requirements</h3>
              <p className="text-card-foreground mb-2">Your file should include the following columns:</p>
              <ul className="space-y-2 text-card-foreground">
                <li>&bull; Title (required) - A descriptive name for your coin (e.g., &quot;US State Quarter - Colorado&quot;)</li>
                <li>&bull; Year (required) - The year the coin was minted</li>
                <li>&bull; Denomination - e.g., &quot;Quarter&quot;, &quot;Penny&quot;, &quot;Dollar&quot;</li>
                <li>&bull; Mint Mark - e.g., &quot;D&quot; for Denver, &quot;S&quot; for San Francisco</li>
                <li>&bull; Grade - The coin&apos;s condition grade</li>
                <li>&bull; Purchase Price - How much you paid for the coin</li>
                <li>&bull; Purchase Date - When you acquired the coin</li>
                <li>&bull; Notes - Any additional information about the coin</li>
              </ul>
            </div>
          </CardContent>
        </Card>
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
