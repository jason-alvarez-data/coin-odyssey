"use client";

import React from "react";
import { BarChart, TrendingUp, Rocket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type DashboardTier = "basic" | "better" | "advanced";

interface DashboardSelectorProps {
  currentTier: DashboardTier;
  onTierChange: (tier: DashboardTier) => void;
}

const tierIcons: Record<DashboardTier, React.ElementType> = {
  basic: BarChart,
  better: TrendingUp,
  advanced: Rocket,
};

const tierInfo: Record<
  DashboardTier,
  { name: string; description: string; features: string[] }
> = {
  basic: {
    name: "Basic",
    description: "Essential metrics and simple charts",
    features: ["Key metrics", "Simple charts", "Clean layout"],
  },
  better: {
    name: "Better",
    description: "Enhanced insights and multiple charts",
    features: ["Collection health", "Multiple charts", "Performance tracking"],
  },
  advanced: {
    name: "Advanced",
    description: "Comprehensive analytics and smart insights",
    features: [
      "Smart insights",
      "ROI analysis",
      "Top performers",
      "Advanced charts",
    ],
  },
};

const tiers: DashboardTier[] = ["basic", "better", "advanced"];

const DashboardSelector: React.FC<DashboardSelectorProps> = ({
  currentTier,
  onTierChange,
}) => {
  const CurrentIcon = tierIcons[currentTier];

  return (
    <Select value={currentTier} onValueChange={onTierChange}>
      <SelectTrigger className="w-[280px] gap-2">
        <div className="flex items-center gap-2">
          <CurrentIcon className="h-4 w-4 shrink-0" />
          <div className="text-left">
            <div className="font-medium leading-none">
              {tierInfo[currentTier].name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {tierInfo[currentTier].description}
            </div>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="w-80">
        {tiers.map((tier) => {
          const Icon = tierIcons[tier];
          const info = tierInfo[tier];
          return (
            <SelectItem key={tier} value={tier} className="p-3">
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{info.name}</span>
                    {currentTier === tier && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {info.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {info.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs font-normal">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
        <div className="border-t p-2">
          <p className="text-xs text-muted-foreground text-center">
            Your selection will be remembered for future visits
          </p>
        </div>
      </SelectContent>
    </Select>
  );
};

export default DashboardSelector;
