import React, { useState } from 'react';
import { Coin } from '../types/coin';
import ValueResearchModal from './ValueResearchModal';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CoinFormProps {
  onSubmit: (coin: Partial<Coin>) => void;
  initialData?: Partial<Coin>;
  isEditing?: boolean;
}

const CoinForm: React.FC<CoinFormProps> = ({ onSubmit, initialData, isEditing }) => {
  const [formData, setFormData] = useState<Partial<Coin>>(initialData || {
    denomination: '',
    title: '',
    year: new Date().getFullYear(),
    mintMark: '',
    grade: '',
  });
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClasses = "mt-2 block w-full rounded-lg bg-[#2a2a2a] border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400 py-2.5 px-4 text-base";
  const labelClasses = "block text-base font-medium text-gray-300";
  const sectionTitleClasses = "text-xl font-medium text-white mb-6";
  const hintTextClasses = "mt-2 text-sm text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className={sectionTitleClasses}>Basic Information</h3>
          
          <div>
            <label htmlFor="title" className={labelClasses}>
              Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., US State Quarter - Colorado"
            />
            <div className={hintTextClasses}>
              A descriptive name for your coin
            </div>
          </div>

          <div>
            <label htmlFor="denomination" className={labelClasses}>
              Denomination*
            </label>
            <input
              type="text"
              id="denomination"
              name="denomination"
              required
              value={formData.denomination || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Penny, Quarter, Dollar"
            />
          </div>

          <div>
            <label htmlFor="year" className={labelClasses}>
              Year*
            </label>
            <input
              type="number"
              id="year"
              name="year"
              required
              value={formData.year || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., 1964"
            />
          </div>

          <div>
            <label htmlFor="mintMark" className={labelClasses}>
              Mint Mark
            </label>
            <input
              type="text"
              id="mintMark"
              name="mintMark"
              value={formData.mintMark || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., D, S, P"
            />
          </div>

          <div>
            <label htmlFor="grade" className={labelClasses}>
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade || ''}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Select Grade</option>
              <option value="MS-70">MS-70 (Perfect Uncirculated)</option>
              <option value="MS-65">MS-65 (Gem Uncirculated)</option>
              <option value="MS-60">MS-60 (Uncirculated)</option>
              <option value="AU-58">AU-58 (Choice About Uncirculated)</option>
              <option value="XF-45">XF-45 (Extremely Fine)</option>
              <option value="VF-30">VF-30 (Very Fine)</option>
              <option value="F-12">F-12 (Fine)</option>
              <option value="VG-8">VG-8 (Very Good)</option>
              <option value="G-4">G-4 (Good)</option>
              <option value="AG-3">AG-3 (About Good)</option>
            </select>
          </div>
        </div>

        {/* Value Information */}
        <div className="space-y-6">
          <h3 className={sectionTitleClasses}>Value Information</h3>
          
          <div>
            <label htmlFor="faceValue" className={labelClasses}>
              Face Value
            </label>
            <div className="mt-2 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-base">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                id="faceValue"
                name="faceValue"
                value={formData.faceValue || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="purchasePrice" className={labelClasses}>
              Purchase Price
            </label>
            <div className="mt-2 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-base">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                id="purchasePrice"
                name="purchasePrice"
                value={formData.purchasePrice || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="purchaseDate" className={labelClasses}>
              Purchase Date
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate || ''}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="currentMarketValue" className={`${labelClasses} flex items-center justify-between`}>
              <span>Current Market Value</span>
              <span className="text-sm text-gray-400">(Manual entry until price API is integrated)</span>
            </label>
            <div className="mt-2 flex gap-3">
              <div className="relative flex-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-base">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="currentMarketValue"
                  name="currentMarketValue"
                  value={formData.currentMarketValue || ''}
                  onChange={handleChange}
                  className={`${inputClasses} pl-8`}
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsResearchModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 border border-gray-600 shadow-sm text-base font-medium rounded-lg text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Research Value
              </button>
            </div>
            <div className={hintTextClasses}>
              Enter your best estimate based on research or recent appraisals
            </div>
          </div>

          <div>
            <label htmlFor="personalValue" className={labelClasses}>
              Personal Value Estimate
            </label>
            <div className="mt-2 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-base">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                id="personalValue"
                name="personalValue"
                value={formData.personalValue || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                placeholder="0.00"
              />
            </div>
            <div className={hintTextClasses}>
              Your personal estimate of the coin's value
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-6">
        <h3 className={sectionTitleClasses}>Additional Information</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="mintage" className={labelClasses}>
              Mintage (if known)
            </label>
            <input
              type="number"
              id="mintage"
              name="mintage"
              value={formData.mintage || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., 1234567"
            />
          </div>

          <div>
            <label htmlFor="rarityScale" className={labelClasses}>
              Rarity Scale (1-10)
            </label>
            <input
              type="number"
              id="rarityScale"
              name="rarityScale"
              min="1"
              max="10"
              value={formData.rarityScale || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="1-10"
            />
            <div className={hintTextClasses}>
              1 = Very Common, 10 = Extremely Rare
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="historicalNotes" className={labelClasses}>
            Historical Notes
          </label>
          <textarea
            id="historicalNotes"
            name="historicalNotes"
            rows={4}
            value={formData.historicalNotes || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Add any historical information about this coin..."
          />
        </div>

        <div>
          <label htmlFor="varietyNotes" className={labelClasses}>
            Variety Notes
          </label>
          <textarea
            id="varietyNotes"
            name="varietyNotes"
            rows={4}
            value={formData.varietyNotes || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Add any variety or error information..."
          />
        </div>

        <div>
          <label htmlFor="notes" className={labelClasses}>
            Personal Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes || ''}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Add any personal notes about this coin..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isEditing ? 'Update Coin' : 'Add Coin'}
        </button>
      </div>

      <ValueResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        coinInfo={{
          denomination: formData.denomination || '',
          year: formData.year || 0,
          mintMark: formData.mintMark,
          grade: formData.grade
        }}
      />
    </form>
  );
};

export default CoinForm; 