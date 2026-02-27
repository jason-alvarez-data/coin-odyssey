"use client";

import { useState, useEffect } from 'react';
import { CollectionGoal, GoalProgress } from '@coin-collecting/shared';
import { GoalsService } from '@/services/goalsService';
import { Trash2, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface GoalCardProps {
  goal: CollectionGoal;
  onDelete: (goalId: string) => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [goal.id]);

  const loadProgress = async () => {
    const progressData = await GoalsService.updateGoalProgress(goal.id);
    if (progressData) {
      setProgress(progressData);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    onDelete(goal.id);
  };

  const categoryColors: Record<string, string> = {
    us_coins: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    world_coins: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
    ancient_coins: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
    modern_coins: 'bg-green-900/30 text-green-400 border-green-800/50',
    commemoratives: 'bg-pink-900/30 text-pink-400 border-pink-800/50',
    precious_metals: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
    paper_money: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/50',
    general: 'bg-secondary text-muted-foreground border-border',
  };

  const priorityColors: Record<string, string> = {
    low: 'text-muted-foreground border-border bg-secondary',
    medium: 'text-yellow-400 border-yellow-800/50 bg-yellow-900/30',
    high: 'text-red-400 border-red-800/50 bg-red-900/30',
  };

  const progressPercentage = progress?.progressPercentage || (goal.targetCount > 0 ? (goal.currentCount / goal.targetCount) * 100 : 0);

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${goal.isCompleted ? 'border-2 border-green-500' : ''}`}>
        <CardHeader className="pb-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                {goal.isCompleted && (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
              </div>
              {goal.description && (
                <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={categoryColors[goal.category]}>
                  {goal.category.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={priorityColors[goal.priority]}>
                  {goal.priority} priority
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="ml-4 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-foreground">Progress</span>
              <span className="text-muted-foreground">
                {goal.currentCount} / {goal.targetCount} coins
              </span>
            </div>
            <Progress
              value={Math.min(progressPercentage, 100)}
              className={`h-3 ${goal.isCompleted ? '[&>div]:bg-green-500' : ''}`}
            />
            <div className="mt-1 text-right text-sm text-muted-foreground">
              {progressPercentage.toFixed(1)}%
            </div>
          </div>

          {/* Milestones */}
          {progress && progress.milestones.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Milestones</p>
              <div className="space-y-2">
                {progress.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`flex items-center text-sm ${
                      milestone.isCompleted ? 'text-green-400' : 'text-muted-foreground'
                    }`}
                  >
                    {milestone.isCompleted ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <div className="h-4 w-4 mr-2 border-2 border-border rounded-full" />
                    )}
                    <span>{milestone.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal Criteria Info */}
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-sm">
            {goal.criteria.country && (
              <div>
                <span className="text-muted-foreground">Country:</span>{' '}
                <span className="font-medium text-foreground">{goal.criteria.country}</span>
              </div>
            )}
            {goal.criteria.denomination && goal.criteria.denomination.length > 0 && (
              <div>
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="font-medium text-foreground">{goal.criteria.denomination.join(', ')}</span>
              </div>
            )}
            {goal.criteria.startYear && goal.criteria.endYear && (
              <div>
                <span className="text-muted-foreground">Years:</span>{' '}
                <span className="font-medium text-foreground">
                  {goal.criteria.startYear} - {goal.criteria.endYear}
                </span>
              </div>
            )}
            {goal.criteria.series && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Series:</span>{' '}
                <span className="font-medium text-foreground">{goal.criteria.series}</span>
              </div>
            )}
          </div>

          {/* Reward */}
          {goal.reward && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-400">
                <span className="font-medium">Reward:</span> {goal.reward}
              </p>
            </div>
          )}

          {/* Completion Date */}
          {goal.completedAt && (
            <div className="text-sm text-muted-foreground">
              Completed on {new Date(goal.completedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{goal.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
