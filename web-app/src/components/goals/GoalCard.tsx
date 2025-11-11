"use client";

import { useState, useEffect } from 'react';
import { CollectionGoal, GoalProgress } from '@/types/goal';
import { GoalsService } from '@/services/goalsService';
import { TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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

  const categoryColors = {
    us_coins: 'bg-blue-900/30 text-blue-400',
    world_coins: 'bg-purple-900/30 text-purple-400',
    ancient_coins: 'bg-amber-900/30 text-amber-400',
    modern_coins: 'bg-green-900/30 text-green-400',
    commemoratives: 'bg-pink-900/30 text-pink-400',
    precious_metals: 'bg-yellow-900/30 text-yellow-400',
    paper_money: 'bg-indigo-900/30 text-indigo-400',
    general: 'bg-gray-700 text-gray-300',
  };

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };

  const progressPercentage = progress?.progressPercentage || (goal.targetCount > 0 ? (goal.currentCount / goal.targetCount) * 100 : 0);

  return (
    <div className={`bg-[#2a2a2a] rounded-lg shadow-sm border-2 ${goal.isCompleted ? 'border-green-500' : 'border-gray-600'} p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
            {goal.isCompleted && (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[goal.category]}`}>
              {goal.category.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[goal.priority]}`}>
              {goal.priority} priority
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300 font-medium">Progress</span>
          <span className="text-gray-400">
            {goal.currentCount} / {goal.targetCount} coins
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              goal.isCompleted ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="mt-1 text-right text-sm text-gray-400">
          {progressPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Milestones */}
      {progress && progress.milestones.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-300 mb-2">Milestones</p>
          <div className="space-y-2">
            {progress.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-center text-sm ${
                  milestone.isCompleted ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                {milestone.isCompleted ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <div className="h-4 w-4 mr-2 border-2 border-gray-600 rounded-full"></div>
                )}
                <span>{milestone.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Criteria Info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {goal.criteria.country && (
            <div>
              <span className="text-gray-500">Country:</span>{' '}
              <span className="text-gray-300 font-medium">{goal.criteria.country}</span>
            </div>
          )}
          {goal.criteria.denomination && goal.criteria.denomination.length > 0 && (
            <div>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="text-gray-300 font-medium">{goal.criteria.denomination.join(', ')}</span>
            </div>
          )}
          {goal.criteria.startYear && goal.criteria.endYear && (
            <div>
              <span className="text-gray-500">Years:</span>{' '}
              <span className="text-gray-300 font-medium">
                {goal.criteria.startYear} - {goal.criteria.endYear}
              </span>
            </div>
          )}
          {goal.criteria.series && (
            <div className="col-span-2">
              <span className="text-gray-500">Series:</span>{' '}
              <span className="text-gray-300 font-medium">{goal.criteria.series}</span>
            </div>
          )}
        </div>
      </div>

      {goal.reward && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-md">
          <p className="text-sm text-yellow-400">
            <span className="font-medium">Reward:</span> {goal.reward}
          </p>
        </div>
      )}

      {/* Completion Date */}
      {goal.completedAt && (
        <div className="mt-4 text-sm text-gray-400">
          Completed on {new Date(goal.completedAt).toLocaleDateString()}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 max-w-md mx-4 border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Goal?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-300 bg-[#353535] rounded-md hover:bg-[#404040]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
