"use client";

import { useState } from 'react';
import { CollectionGoal, GoalType, GoalCategory, GoalCriteria, GOAL_TEMPLATES } from '@coin-collecting/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

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
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Set up a new collecting goal to track your progress.
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Step 1: Choose Template or Custom */}
          {step === 'choose' && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">How would you like to create your goal?</h3>

              <div className="space-y-4 mb-6">
                <Card
                  className="cursor-pointer p-6 border-2 hover:border-primary transition-all"
                  onClick={() => setStep('template')}
                >
                  <h4 className="text-lg font-medium text-foreground mb-2">Use a Template</h4>
                  <p className="text-muted-foreground">Choose from popular collecting goals with pre-configured settings</p>
                </Card>

                <Card
                  className="cursor-pointer p-6 border-2 hover:border-primary transition-all"
                  onClick={() => setStep('custom')}
                >
                  <h4 className="text-lg font-medium text-foreground mb-2">Create Custom Goal</h4>
                  <p className="text-muted-foreground">Define your own goal with custom criteria</p>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 'template' && !selectedTemplate && (
            <div>
              <Button
                variant="link"
                className="mb-4 p-0 h-auto text-sm"
                onClick={() => setStep('choose')}
              >
                &larr; Back
              </Button>

              <h3 className="text-lg font-medium text-foreground mb-4">Choose a Template</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer p-4 border-2 hover:border-primary transition-all"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <h5 className="font-medium text-foreground mb-1">{template.title}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary">{template.estimatedDifficulty}</Badge>
                      <span className="text-muted-foreground">{template.estimatedTimeframe}</span>
                      <span className="text-muted-foreground">{template.targetCount} coins</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Edit Goal Form */}
          {(step === 'custom' || (step === 'template' && selectedTemplate)) && (
            <div>
              <Button
                variant="link"
                className="mb-4 p-0 h-auto text-sm"
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep(step === 'template' ? 'template' : 'choose');
                }}
              >
                &larr; Back
              </Button>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title *</Label>
                  <Input
                    id="goal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Complete State Quarters Collection"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-description">Description</Label>
                  <Textarea
                    id="goal-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your collecting goal..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select value={goalType} onValueChange={(value) => setGoalType(value as GoalType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="series_complete">Complete Series</SelectItem>
                        <SelectItem value="year_range">Year Range</SelectItem>
                        <SelectItem value="country_complete">Country Collection</SelectItem>
                        <SelectItem value="denomination_set">Denomination Set</SelectItem>
                        <SelectItem value="quantity_target">Quantity Target</SelectItem>
                        <SelectItem value="value_target">Value Target</SelectItem>
                        <SelectItem value="geographic_spread">Geographic Spread</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as GoalCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us_coins">US Coins</SelectItem>
                        <SelectItem value="world_coins">World Coins</SelectItem>
                        <SelectItem value="ancient_coins">Ancient Coins</SelectItem>
                        <SelectItem value="modern_coins">Modern Coins</SelectItem>
                        <SelectItem value="commemoratives">Commemoratives</SelectItem>
                        <SelectItem value="precious_metals">Precious Metals</SelectItem>
                        <SelectItem value="paper_money">Paper Money</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-count">Target Count *</Label>
                    <Input
                      id="target-count"
                      type="number"
                      value={targetCount}
                      onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Criteria */}
                <Separator />

                <div>
                  <h4 className="text-base font-medium text-foreground mb-4">Goal Criteria</h4>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="criteria-country">Country</Label>
                      <Input
                        id="criteria-country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g., United States"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="criteria-denomination">Denomination (comma separated)</Label>
                      <Input
                        id="criteria-denomination"
                        type="text"
                        value={denomination.join(', ')}
                        onChange={(e) => setDenomination(e.target.value.split(',').map(d => d.trim()))}
                        placeholder="e.g., Quarter, Dime"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="criteria-series">Series Name</Label>
                      <Input
                        id="criteria-series"
                        type="text"
                        value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        placeholder="e.g., American Women Quarters"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="criteria-start-year">Start Year</Label>
                        <Input
                          id="criteria-start-year"
                          type="number"
                          value={startYear || ''}
                          onChange={(e) => setStartYear(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g., 2022"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="criteria-end-year">End Year</Label>
                        <Input
                          id="criteria-end-year"
                          type="number"
                          value={endYear || ''}
                          onChange={(e) => setEndYear(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="e.g., 2025"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="criteria-mint-marks">Mint Marks (comma separated)</Label>
                      <Input
                        id="criteria-mint-marks"
                        type="text"
                        value={mintMarks.join(', ')}
                        onChange={(e) => setMintMarks(e.target.value.split(',').map(m => m.trim()).filter(m => m))}
                        placeholder="e.g., P, D, S"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-reward">Reward (optional)</Label>
                  <Input
                    id="goal-reward"
                    type="text"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="e.g., Treat myself to a special coin"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!isFormValid}>
                  Create Goal
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
