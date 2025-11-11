"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GoalsService } from '@/services/goalsService';
import { CollectionGoal, GoalTemplate, GOAL_TEMPLATES } from '@/types/goal';
import Header from '@/components/layout/Header';
import GoalCard from '@/components/goals/GoalCard';
import CreateGoalModal from '@/components/goals/CreateGoalModal';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function GoalsPage() {
  const [goals, setGoals] = useState<CollectionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadGoals();

    // Subscribe to goal changes
    const channel = supabase
      .channel('goals-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_goals'
        },
        () => {
          loadGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const userGoals = await GoalsService.getUserGoals();
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goal: Omit<CollectionGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentCount' | 'isCompleted'>) => {
    const newGoal = await GoalsService.createGoal(goal);
    if (newGoal) {
      setGoals([newGoal, ...goals]);
      setShowCreateModal(false);
    }
  };

  const handleCreateFromTemplate = async (template: GoalTemplate) => {
    const newGoal = await GoalsService.createGoalFromTemplate(template.id);
    if (newGoal) {
      setGoals([newGoal, ...goals]);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const success = await GoalsService.deleteGoal(goalId);
    if (success) {
      setGoals(goals.filter(g => g.id !== goalId));
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.isCompleted;
    if (filter === 'completed') return goal.isCompleted;
    return true;
  });

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Collection Goals
          </h1>
          <p className="text-gray-600">
            Set goals to track your collecting progress and stay motivated
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{goals.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <SparklesIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Goals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeGoals.length}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedGoals.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              All Goals
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Goal
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading goals...</p>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
            </h3>
            <p className="text-gray-600 mb-6">
              Start by creating your first collection goal to track your progress
            </p>
            {filter === 'all' && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Goal
                </button>

                {/* Goal Templates */}
                <div className="mt-12">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Or start with a template:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GOAL_TEMPLATES.slice(0, 3).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <h5 className="font-medium text-gray-900 mb-1">{template.title}</h5>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded">{template.estimatedDifficulty}</span>
                          <span className="text-gray-500">{template.estimatedTimeframe}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
}
