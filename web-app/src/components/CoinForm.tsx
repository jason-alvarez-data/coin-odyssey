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
    obverseImage: '',
    reverseImage: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    country: '',
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

  const handleImageChange = (side: 'obverse' | 'reverse') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [side === 'obverse' ? 'obverseImage' : 'reverseImage']: imageUrl
      }));
    }
  };

  const inputClasses = "mt-2 block w-full rounded-lg bg-[#2a2a2a] border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400 py-2.5 px-4 text-base";
  const labelClasses = "block text-base font-medium text-gray-300";
  const sectionTitleClasses = "text-xl font-medium text-white mb-6";
  const hintTextClasses = "mt-2 text-sm text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className={sectionTitleClasses}>Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., 1964 Kennedy Half Dollar"
            />
          </div>

          <div>
            <label className={labelClasses}>Denomination</label>
            <input
              type="text"
              name="denomination"
              value={formData.denomination || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Half Dollar"
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Country</label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., United States"
            />
          </div>

          <div>
            <label className={labelClasses}>Year</label>
            <input
              type="number"
              name="year"
              value={formData.year || ''}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>
        </div>
      </div>

      {/* Grading & Condition */}
      <div>
        <h3 className={sectionTitleClasses}>Grading & Condition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Mint Mark</label>
            <input
              type="text"
              name="mintMark"
              value={formData.mintMark || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., D"
            />
          </div>

          <div>
            <label className={labelClasses}>Grade</label>
            <input
              type="text"
              name="grade"
              value={formData.grade || ''}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., MS-65"
            />
          </div>
        </div>
      </div>

      {/* Valuation */}
      <div>
        <h3 className={sectionTitleClasses}>Valuation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Face Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="faceValue"
                value={formData.faceValue || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Purchase Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate || ''}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Current Market Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                name="currentMarketValue"
                value={formData.currentMarketValue || ''}
                onChange={handleChange}
                className={`${inputClasses} pl-8`}
                step="0.01"
              />
              <button
                type="button"
                onClick={() => setIsResearchModalOpen(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Images */}
      <div>
        <h3 className={sectionTitleClasses}>Coin Images</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Obverse (Front) Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange('obverse')}
              className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            />
            {formData.obverseImage && (
              <div className="mt-2">
                <img src={formData.obverseImage} alt="Obverse" className="w-32 h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div>
            <label className={labelClasses}>Reverse (Back) Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange('reverse')}
              className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            />
            {formData.reverseImage && (
              <div className="mt-2">
                <img src={formData.reverseImage} alt="Reverse" className="w-32 h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className={sectionTitleClasses}>Additional Information</h3>
        <div>
          <label className={labelClasses}>Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            className={`${inputClasses} h-32`}
            placeholder="Add any additional notes about the coin..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isEditing ? 'Update Coin' : 'Add Coin'}
        </button>
      </div>

      <ValueResearchModal
        isOpen={isResearchModalOpen}
        onClose={() => setIsResearchModalOpen(false)}
        onValueSelect={(value) => {
          setFormData(prev => ({ ...prev, currentMarketValue: value }));
          setIsResearchModalOpen(false);
        }}
        coinInfo={{
          denomination: formData.denomination || '',
          year: formData.year || 0,
          mintMark: formData.mintMark || '',
          grade: formData.grade || ''
        }}
      />
    </form>
  );
};

export default CoinForm; 