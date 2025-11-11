"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AchievementService } from '@/services/achievementService';
import { Achievement, ACHIEVEMENTS, RARITY_COLORS } from '@/types/achievement';
import Header from '@/components/layout/Header';
import AchievementCard from '@/components/achievements/AchievementCard';
import { TrophyIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<(Achievement & { progress?: { current: number; required: number } })[]>([]);
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalAvailable: ACHIEVEMENTS.length,
    recentUnlocked: [] as Achievement[],
    nearCompletion: [] as Achievement[],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'goal' | 'collection' | 'milestone' | 'special'>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [achievementsData, statsData] = await Promise.all([
        AchievementService.getAvailableAchievements(user.id),
        AchievementService.getAchievementStats(user.id),
      ]);

      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const isUnlocked = achievement.progress && achievement.progress.current >= achievement.progress.required;

    // Status filter
    if (filter === 'unlocked' && !isUnlocked) return false;
    if (filter === 'locked' && isUnlocked) return false;
    if (filter !== 'all' && filter !== 'unlocked' && filter !== 'locked' && achievement.rarity !== filter) return false;

    // Category filter
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;

    return true;
  });

  const rarityDistribution = {
    common: achievements.filter(a => a.rarity === 'common' && a.progress && a.progress.current >= a.progress.required).length,
    uncommon: achievements.filter(a => a.rarity === 'uncommon' && a.progress && a.progress.current >= a.progress.required).length,
    rare: achievements.filter(a => a.rarity === 'rare' && a.progress && a.progress.current >= a.progress.required).length,
    epic: achievements.filter(a => a.rarity === 'epic' && a.progress && a.progress.current >= a.progress.required).length,
    legendary: achievements.filter(a => a.rarity === 'legendary' && a.progress && a.progress.current >= a.progress.required).length,
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Achievements
          </h1>
          <p className="text-gray-400">
            Track your collecting accomplishments and unlock rewards
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#2a2a2a] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Unlocked</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">
                  {stats.totalUnlocked}/{stats.totalAvailable}
                </p>
              </div>
              <div className="bg-yellow-900/30 rounded-full p-3">
                <TrophyIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.totalUnlocked / stats.totalAvailable) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Recent</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{stats.recentUnlocked.length}</p>
              </div>
              <div className="bg-green-900/30 rounded-full p-3">
                <SparklesIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Last 7 days</p>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Near Completion</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">{stats.nearCompletion.length}</p>
              </div>
              <div className="bg-blue-900/30 rounded-full p-3">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">≥75% progress</p>
          </div>

          <div className="bg-[#2a2a2a] rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-400 mb-3">Rarity</p>
            <div className="space-y-2">
              {Object.entries(rarityDistribution).map(([rarity, count]) => (
                count > 0 && (
                  <div key={rarity} className="flex items-center justify-between text-sm">
                    <span className="capitalize" style={{ color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] }}>
                      {rarity}
                    </span>
                    <span className="font-semibold text-gray-300">{count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#2a2a2a] rounded-lg shadow p-4 mb-6 border border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'unlocked', 'locked'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#353535] text-gray-300 hover:bg-[#404040]'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter(r as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === r
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#353535] text-gray-300 hover:bg-[#404040]'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <div className="flex gap-2 flex-wrap">
                {['all', 'goal', 'collection', 'milestone', 'special'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      categoryFilter === c
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#353535] text-gray-300 hover:bg-[#404040]'
                    }`}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-400">Loading achievements...</p>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-lg shadow-sm p-12 text-center">
            <LockClosedIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No achievements found
            </h3>
            <p className="text-gray-400">
              Try adjusting your filters to see more achievements
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
