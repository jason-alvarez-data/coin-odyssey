import React, { useState } from 'react';
import { Coin } from '@/types/coin';

interface CoinFormProps {
  onSubmit: (data: Partial<Coin>) => void;
  initialData?: Partial<Coin>;
}

export default function CoinForm({ onSubmit, initialData }: CoinFormProps) {
  const [formData, setFormData] = useState<Partial<Coin>>({
    denomination: initialData?.denomination || '',
    year: initialData?.year || new Date().getFullYear(),
    mintMark: initialData?.mintMark || '',
    grade: initialData?.grade || '',
    purchasePrice: initialData?.purchasePrice || 0,
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    images: initialData?.images || [],
    faceValue: initialData?.faceValue || null,
    currentMarketValue: initialData?.currentMarketValue || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));
      setFormData({ ...formData, images: imageUrls });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="denomination" className="block text-sm font-medium text-gray-300">
            Denomination
          </label>
          <input
            type="text"
            id="denomination"
            name="denomination"
            value={formData.denomination}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-300">
            Year
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="mintMark" className="block text-sm font-medium text-gray-300">
            Mint Mark
          </label>
          <input
            type="text"
            id="mintMark"
            name="mintMark"
            value={formData.mintMark || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-300">
            Grade
          </label>
          <input
            type="text"
            id="grade"
            name="grade"
            value={formData.grade || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
          />
        </div>

        <div>
          <label htmlFor="faceValue" className="block text-sm font-medium text-gray-300">
            Face Value ($)
          </label>
          <input
            type="number"
            id="faceValue"
            name="faceValue"
            value={formData.faceValue || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
          />
        </div>

        <div>
          <label htmlFor="currentMarketValue" className="block text-sm font-medium text-gray-300">
            Current Market Value ($)
          </label>
          <input
            type="number"
            id="currentMarketValue"
            name="currentMarketValue"
            value={formData.currentMarketValue || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
          />
        </div>

        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-300">
            Purchase Price ($)
          </label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice || ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-300">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={typeof formData.purchaseDate === 'string' ? formData.purchaseDate : ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-gray-600 text-white"
        />
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-300">
          Images
        </label>
        <input
          type="file"
          id="images"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="mt-1 block w-full text-white"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {initialData ? 'Update Coin' : 'Add Coin'}
        </button>
      </div>
    </form>
  );
} 