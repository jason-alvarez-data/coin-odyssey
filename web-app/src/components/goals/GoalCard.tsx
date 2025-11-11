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
    us_coins: 'bg-blue-100 text-blue-800',
    world_coins: 'bg-purple-100 text-purple-800',
    ancient_coins: 'bg-amber-100 text-amber-800',
    modern_coins: 'bg-green-100 text-green-800',
    commemoratives: 'bg-pink-100 text-pink-800',
    precious_metals: 'bg-yellow-100 text-yellow-800',
    paper_money: 'bg-indigo-100 text-indigo-800',
    general: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
  };

  const progressPercentage = progress?.progressPercentage || (goal.targetCount > 0 ? (goal.currentCount / goal.targetCount) * 100 : 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${goal.isCompleted ? 'border-green-500' : 'border-gray-200'} p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
            {goal.isCompleted && (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
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
          <span className="text-gray-700 font-medium">Progress</span>
          <span className="text-gray-600">
            {goal.currentCount} / {goal.targetCount} coins
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              goal.isCompleted ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="mt-1 text-right text-sm text-gray-600">
          {progressPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Milestones */}
      {progress && progress.milestones.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
          <div className="space-y-2">
            {progress.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-center text-sm ${
                  milestone.isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {milestone.isCompleted ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <div className="h-4 w-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                )}
                <span>{milestone.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Criteria Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {goal.criteria.country && (
            <div>
              <span className="text-gray-500">Country:</span>{' '}
              <span className="text-gray-900 font-medium">{goal.criteria.country}</span>
            </div>
          )}
          {goal.criteria.denomination && goal.criteria.denomination.length > 0 && (
            <div>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="text-gray-900 font-medium">{goal.criteria.denomination.join(', ')}</span>
            </div>
          )}
          {goal.criteria.startYear && goal.criteria.endYear && (
            <div>
              <span className="text-gray-500">Years:</span>{' '}
              <span className="text-gray-900 font-medium">
                {goal.criteria.startYear} - {goal.criteria.endYear}
              </span>
            </div>
          )}
          {goal.criteria.series && (
            <div className="col-span-2">
              <span className="text-gray-500">Series:</span>{' '}
              <span className="text-gray-900 font-medium">{goal.criteria.series}</span>
            </div>
          )}
        </div>
      </div>

      {goal.reward && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Reward:</span> {goal.reward}
          </p>
        </div>
      )}

      {/* Completion Date */}
      {goal.completedAt && (
        <div className="mt-4 text-sm text-gray-600">
          Completed on {new Date(goal.completedAt).toLocaleDateString()}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Goal?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
