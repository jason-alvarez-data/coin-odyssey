import React, { useState, useEffect } from 'react';
import { Coin } from '../types/coin';
import { createClient } from '@supabase/supabase-js';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import CoinValueChart from './CoinValueChart';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface CoinDetailProps {
  coin: Coin;
  onUpdate?: (coin: Coin) => void;
}

interface GradingGuide {
  grade: string;
  description: string;
  key_identifying_marks: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CoinDetail: React.FC<CoinDetailProps> = ({ coin, onUpdate }) => {
  const [gradingGuide, setGradingGuide] = useState<GradingGuide | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCoin, setEditedCoin] = useState(coin);

  useEffect(() => {
    fetchGradingGuide();
  }, [coin.grade]);

  const fetchGradingGuide = async () => {
    if (coin.grade) {
      const { data, error } = await supabase
        .from('grading_guides')
        .select('*')
        .eq('grade', coin.grade)
        .single();

      if (!error && data) {
        setGradingGuide(data);
      }
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('coins')
      .update(editedCoin)
      .eq('id', coin.id);

    if (!error && onUpdate) {
      onUpdate(editedCoin);
    }
    setIsEditing(false);
  };

  const renderRarityScale = (scale: number | null) => {
    if (!scale) return 'Not rated';
    const filled = '★'.repeat(scale);
    const empty = '☆'.repeat(10 - scale);
    return filled + empty;
  };

  const getValueTrend = () => {
    if (!coin.currentMarketValue || !coin.purchasePrice) return null;
    const difference = coin.currentMarketValue - coin.purchasePrice;
    const percentageChange = (difference / coin.purchasePrice) * 100;
    
    return {
      difference,
      percentageChange,
      isPositive: difference > 0
    };
  };

  const trend = getValueTrend();

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      {/* Basic Information */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {coin.year} {coin.denomination} {coin.mintMark && `(${coin.mintMark})`}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Grade: {coin.grade || 'Ungraded'}</p>
            <p className="text-gray-600">Mint Mark: {coin.mintMark || 'None'}</p>
            <p className="text-gray-600">Face Value: {formatCurrency(coin.faceValue)}</p>
          </div>
          <div>
            <p className="text-gray-600">Purchase Date: {coin.purchaseDate || 'Not recorded'}</p>
            <p className="text-gray-600">Purchase Price: {formatCurrency(coin.purchasePrice)}</p>
            <p className="text-gray-600">Personal Value: {formatCurrency(coin.personalValue)}</p>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Grading Information */}
        <Disclosure as="div">
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <span className="font-medium">Grading Information</span>
                <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-600">
                {gradingGuide ? (
                  <div>
                    <p className="font-semibold">{gradingGuide.grade}</p>
                    <p>{gradingGuide.description}</p>
                    <p className="mt-2 font-semibold">Key Identifying Marks:</p>
                    <p>{gradingGuide.key_identifying_marks}</p>
                  </div>
                ) : (
                  <p>No grading information available for this grade.</p>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Rarity and Mintage */}
        <Disclosure as="div">
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <span className="font-medium">Rarity & Mintage</span>
                <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-600">
                <div className="space-y-2">
                  <p>Rarity Scale: {renderRarityScale(coin.rarityScale)}</p>
                  <p>Mintage: {coin.mintage?.toLocaleString() || 'Unknown'}</p>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Historical Notes */}
        <Disclosure as="div">
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <span className="font-medium">Historical Information</span>
                <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-600">
                {coin.historicalNotes ? (
                  <p>{coin.historicalNotes}</p>
                ) : (
                  <p>No historical information recorded.</p>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Variety Information */}
        <Disclosure as="div">
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <span className="font-medium">Variety Information</span>
                <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-600">
                {coin.varietyNotes ? (
                  <p>{coin.varietyNotes}</p>
                ) : (
                  <p>No variety information recorded.</p>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Notes */}
        <Disclosure as="div">
          {({ open }: { open: boolean }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <span className="font-medium">Personal Notes</span>
                <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-gray-600">
                {coin.notes ? (
                  <p>{coin.notes}</p>
                ) : (
                  <p>No personal notes recorded.</p>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>

      {/* Edit Button */}
      <div className="mt-6">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Details
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedCoin(coin);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Value History</h3>
          <CoinValueChart coinId={coin.id} />
          
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">1W</button>
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">1M</button>
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">3M</button>
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">6M</button>
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">1Y</button>
            <button className="px-3 py-1 text-sm rounded border hover:bg-gray-50">All</button>
          </div>
        </div>

        <div>
          <div>
            <p className="text-gray-600">Current Market Value</p>
            <div className="flex items-center gap-2">
              <p className="text-lg">{formatCurrency(coin.currentMarketValue)}</p>
              {trend && (
                <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? (
                    <ArrowUpIcon className="h-5 w-5" />
                  ) : (
                    <ArrowDownIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm">
                    {trend.percentageChange.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {coin.lastValueUpdate && (
            <div className="text-sm text-gray-500">
              Last updated: {new Date(coin.lastValueUpdate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinDetail; 