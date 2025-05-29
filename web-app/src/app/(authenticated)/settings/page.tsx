'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'Light',
    currencyFormat: 'USD ($)',
    dateFormat: 'MM/DD/YYYY',
    defaultView: 'Table View',
    defaultSorting: 'Date Added',
    visibleColumns: {
      dateCollected: true,
      title: true,
      year: true,
      country: true,
      value: true,
      unit: true,
      mint: true,
      mintMark: true,
      status: true,
      type: true,
      series: true,
      storage: true,
      format: true,
      region: true,
      quantity: true,
    }
  });

  const handleCheckboxChange = (field: string) => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: {
        ...prev.visibleColumns,
        [field]: !prev.visibleColumns[field as keyof typeof prev.visibleColumns]
      }
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportBackup = () => {
    // TODO: Implement export functionality
    console.log('Exporting backup...');
  };

  const handleImportBackup = () => {
    // TODO: Implement import functionality
    console.log('Importing backup...');
  };

  const handleClearData = () => {
    // TODO: Implement clear data functionality with confirmation
    console.log('Clearing data...');
  };

  return (
    <div className="flex-1 bg-[#1e1e1e] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Header />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Application Preferences */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Application Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSelectChange('theme', e.target.value)}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Currency Format</label>
              <select
                value={settings.currencyFormat}
                onChange={(e) => handleSelectChange('currencyFormat', e.target.value)}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleSelectChange('dateFormat', e.target.value)}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collection Display */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Collection Display</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Collection View</label>
              <select
                value={settings.defaultView}
                onChange={(e) => handleSelectChange('defaultView', e.target.value)}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="Table View">Table View</option>
                <option value="Grid View">Grid View</option>
                <option value="List View">List View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Sorting</label>
              <select
                value={settings.defaultSorting}
                onChange={(e) => handleSelectChange('defaultSorting', e.target.value)}
                className="w-full bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
              >
                <option value="Date Added">Date Added</option>
                <option value="Title">Title</option>
                <option value="Year">Year</option>
                <option value="Value">Value</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Visible Columns</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {Object.entries(settings.visibleColumns).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleCheckboxChange(key)}
                      className="rounded bg-[#1e1e1e] border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Backup Collection</label>
              <div className="flex gap-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Export Backup
                </button>
                <select
                  className="bg-[#1e1e1e] text-white rounded-lg px-3 py-2 border border-gray-600"
                  defaultValue="JSON"
                >
                  <option value="JSON">JSON</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Import Backup</label>
              <button
                onClick={handleImportBackup}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Import Backup
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Clear Application Data</label>
              <button
                onClick={handleClearData}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 