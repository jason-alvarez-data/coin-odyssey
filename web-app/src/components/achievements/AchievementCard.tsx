"use client";

import { Achievement, RARITY_COLORS, RARITY_LABELS } from '@coin-collecting/shared';
import { Lock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
    badge: '\u{1F396}',
    title: '\u{1F451}',
    feature: '\u{2728}',
    points: '\u{2B50}',
  };

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md border-2 ${
        isUnlocked ? '' : 'border-border'
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
              <h3 className="text-lg font-semibold text-foreground">
                {achievement.title}
              </h3>
              {isUnlocked && (
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: rarityColor }}
                />
              )}
              {!isUnlocked && (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <p className={`text-sm mb-2 ${isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
              {achievement.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                className="rounded-full text-white"
                style={{ backgroundColor: rarityColor }}
              >
                {rarityLabel}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {achievement.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlocked && achievement.progress && (
        <div className="px-6 py-3 bg-muted/50 border-t border-border">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span className="font-medium">
              {achievement.progress.current} / {achievement.progress.required}
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2 bg-muted"
            indicatorStyle={{ backgroundColor: rarityColor }}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground/70">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Reward */}
      <CardContent className="px-6 py-3 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-t border-yellow-900/30">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{rewardTypeIcon[achievement.reward.type]}</span>
          <div>
            <span className="text-muted-foreground">Reward: </span>
            <span className="font-medium text-yellow-400">
              {achievement.reward.value}
            </span>
            <span className="text-muted-foreground/70 text-xs ml-1">
              ({achievement.reward.type})
            </span>
          </div>
        </div>
      </CardContent>

      {/* Unlocked Date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="px-6 py-2 bg-green-900/20 border-t border-green-900/30 text-xs text-green-400">
          Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </Card>
  );
}
