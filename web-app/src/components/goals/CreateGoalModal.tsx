"use client";

import { useState } from 'react';
import { CollectionGoal, GoalType, GoalCategory, GoalCriteria, GOAL_TEMPLATES } from '@/types/goal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateGoalModalProps {
  onClose: () => void;
  onCreate: (goal: Omit<CollectionGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentCount' | 'isCompleted'>) => void;
}

export default function CreateGoalModal({ onClose, onCreate }: CreateGoalModalProps) {
  const [step, setStep] = useState<'choose' | 'template' | 'custom'>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('series_complete');
  const [category, setCategory] = useState<GoalCategory>('us_coins');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetCount, setTargetCount] = useState(20);
  const [reward, setReward] = useState('');

  // Criteria state
  const [country, setCountry] = useState('United States');
  const [denomination, setDenomination] = useState<string[]>(['Quarter']);
  const [series, setSeries] = useState('');
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [mintMarks, setMintMarks] = useState<string[]>([]);

  const handleSelectTemplate = (templateId: string) => {
    const template = GOAL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setGoalType(template.goalType);
      setCategory(template.category);
      setTargetCount(template.targetCount);
      setCountry(template.criteria.country || 'United States');
      setDenomination(template.criteria.denomination || ['Quarter']);
      setSeries(template.criteria.series || '');
      setStartYear(template.criteria.startYear);
      setEndYear(template.criteria.endYear);
      setMintMarks(template.criteria.mintMark || []);
      setStep('template');
      setSelectedTemplate(templateId);
    }
  };

  const handleCreate = () => {
    const criteria: GoalCriteria = {
      country: country || undefined,
      denomination: denomination.length > 0 ? denomination : undefined,
      series: series || undefined,
      startYear: startYear,
      endYear: endYear,
      mintMark: mintMarks.length > 0 ? mintMarks : undefined,
    };

    onCreate({
      title,
      description,
      goalType,
      criteria,
      targetCount,
      userId: '', // Will be set by the service
      priority,
      category,
      reward: reward || undefined,
    });
  };

  const isFormValid = title.trim() !== '' && targetCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Choose Template or Custom */}
          {step === 'choose' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">How would you like to create your goal?</h3>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setStep('template')}
                  className="w-full text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Use a Template</h4>
                  <p className="text-gray-600">Choose from popular collecting goals with pre-configured settings</p>
                </button>

                <button
                  onClick={() => setStep('custom')}
                  className="w-full text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Create Custom Goal</h4>
                  <p className="text-gray-600">Define your own goal with custom criteria</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 'template' && !selectedTemplate && (
            <div>
              <button
                onClick={() => setStep('choose')}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center text-sm"
              >
                ← Back
              </button>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Template</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <h5 className="font-medium text-gray-900 mb-1">{template.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded">{template.estimatedDifficulty}</span>
                      <span className="text-gray-500">{template.estimatedTimeframe}</span>
                      <span className="text-gray-500">{template.targetCount} coins</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Edit Goal Form */}
          {(step === 'custom' || (step === 'template' && selectedTemplate)) && (
            <div>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep(step === 'template' ? 'template' : 'choose');
                }}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center text-sm"
              >
                ← Back
              </button>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Complete State Quarters Collection"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your collecting goal..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal Type
                    </label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as GoalType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="series_complete">Complete Series</option>
                      <option value="year_range">Year Range</option>
                      <option value="country_complete">Country Collection</option>
                      <option value="denomination_set">Denomination Set</option>
                      <option value="quantity_target">Quantity Target</option>
                      <option value="value_target">Value Target</option>
                      <option value="geographic_spread">Geographic Spread</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as GoalCategory)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="us_coins">US Coins</option>
                      <option value="world_coins">World Coins</option>
                      <option value="ancient_coins">Ancient Coins</option>
                      <option value="modern_coins">Modern Coins</option>
                      <option value="commemoratives">Commemoratives</option>
                      <option value="precious_metals">Precious Metals</option>
                      <option value="paper_money">Paper Money</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Count *
                    </label>
                    <input
                      type="number"
                      value={targetCount}
                      onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Criteria */}
                <div className="border-t pt-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Goal Criteria</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g., United States"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Denomination (comma separated)
                      </label>
                      <input
                        type="text"
                        value={denomination.join(', ')}
                        onChange={(e) => setDenomination(e.target.value.split(',').map(d => d.trim()))}
                        placeholder="e.g., Quarter, Dime"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Series Name
                      </label>
                      <input
                        type="text"
                        value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        placeholder="e.g., American Women Quarters"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Year
                        </label>
                        <input
                          type="number"
                          value={startYear || ''}
                          onChange={(e) => setStartYear(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g., 2022"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Year
                        </label>
                        <input
                          type="number"
                          value={endYear || ''}
                          onChange={(e) => setEndYear(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g., 2025"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mint Marks (comma separated)
                      </label>
                      <input
                        type="text"
                        value={mintMarks.join(', ')}
                        onChange={(e) => setMintMarks(e.target.value.split(',').map(m => m.trim()).filter(m => m))}
                        placeholder="e.g., P, D, S"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reward (optional)
                  </label>
                  <input
                    type="text"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="e.g., Treat myself to a special coin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'custom' || (step === 'template' && selectedTemplate)) && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isFormValid}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
