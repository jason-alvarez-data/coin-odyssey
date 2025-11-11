"use client";

import { Achievement, RARITY_COLORS, RARITY_LABELS } from '@/types/achievement';
import { LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface AchievementCardProps {
  achievement: Achievement & { progress?: { current: number; required: number } };
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = achievement.progress && achievement.progress.current >= achievement.progress.required;
  const progressPercentage = achievement.progress
    ? Math.min((achievement.progress.current / achievement.progress.required) * 100, 100)
    : 0;

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const rarityLabel = RARITY_LABELS[achievement.rarity];

  const rewardTypeIcon = {
    badge: '🏅',
    title: '👑',
    feature: '✨',
    points: '⭐',
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
        isUnlocked ? 'border-yellow-400' : 'border-gray-200'
      }`}
      style={{
        borderColor: isUnlocked ? rarityColor : undefined,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-start justify-between"
        style={{
          background: isUnlocked
            ? `linear-gradient(135deg, ${rarityColor}15 0%, ${rarityColor}05 100%)`
            : 'transparent'
        }}
      >
        <div className="flex items-start gap-4 flex-1">
          {/* Icon */}
          <div className={`text-5xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {achievement.title}
              </h3>
              {isUnlocked && (
                <CheckCircleIcon
                  className="h-5 w-5"
                  style={{ color: rarityColor }}
                />
              )}
              {!isUnlocked && (
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <p className={`text-sm mb-2 ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
              {achievement.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: rarityColor }}
              >
                {rarityLabel}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {achievement.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlocked && achievement.progress && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-medium">
              {achievement.progress.current} / {achievement.progress.required}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: rarityColor,
              }}
            ></div>
          </div>
          <div className="mt-1 text-right text-xs text-gray-500">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Reward */}
      <div className="px-6 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-t border-yellow-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{rewardTypeIcon[achievement.reward.type]}</span>
          <div>
            <span className="text-gray-600">Reward: </span>
            <span className="font-medium text-gray-900">
              {achievement.reward.value}
            </span>
            <span className="text-gray-500 text-xs ml-1">
              ({achievement.reward.type})
            </span>
          </div>
        </div>
      </div>

      {/* Unlocked Date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="px-6 py-2 bg-green-50 border-t border-green-100 text-xs text-green-700">
          Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
