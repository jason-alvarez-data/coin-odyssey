"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { GoalsService } from "@/services/goalsService"
import { CollectionGoal, GoalTemplate, GOAL_TEMPLATES } from "@coin-collecting/shared"
import GoalCard from "@/components/goals/GoalCard"
import CreateGoalModal from "@/components/goals/CreateGoalModal"
import { Plus, Sparkles, Zap, CheckCircle, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function GoalsPage() {
  const [goals, setGoals] = useState<CollectionGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  useEffect(() => {
    loadGoals()

    const channel = supabase
      .channel("goals-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collection_goals" },
        () => loadGoals()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const userGoals = await GoalsService.getUserGoals()
      setGoals(userGoals)
    } catch (error) {
      console.error("Error loading goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (
    goal: Omit<
      CollectionGoal,
      "id" | "createdAt" | "updatedAt" | "currentCount" | "isCompleted"
    >
  ) => {
    const newGoal = await GoalsService.createGoal(goal)
    if (newGoal) {
      setGoals([newGoal, ...goals])
      setShowCreateModal(false)
    }
  }

  const handleCreateFromTemplate = async (template: GoalTemplate) => {
    const newGoal = await GoalsService.createGoalFromTemplate(template.id)
    if (newGoal) {
      setGoals([newGoal, ...goals])
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const success = await GoalsService.deleteGoal(goalId)
    if (success) {
      setGoals(goals.filter((g) => g.id !== goalId))
    }
  }

  const filteredGoals = goals.filter((goal) => {
    if (filter === "active") return !goal.isCompleted
    if (filter === "completed") return goal.isCompleted
    return true
  })

  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Collection Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set goals to track your collecting progress
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Goals</p>
                <p className="text-xl font-bold text-primary">{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-yellow-500">
                  {activeGoals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-500">
                  {completedGoals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as typeof filter)}
      >
        <TabsList>
          <TabsTrigger value="all">All Goals</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Goals List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium mb-1">
              {filter === "all" ? "No goals yet" : `No ${filter} goals`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by creating your first collection goal
            </p>
            {filter === "all" && (
              <>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Your First Goal
                </Button>

                <div className="mt-8 w-full max-w-2xl">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Or start with a template:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {GOAL_TEMPLATES.slice(0, 3).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template)}
                        className="text-left p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-accent transition-all"
                      >
                        <h5 className="text-sm font-medium mb-1">
                          {template.title}
                        </h5>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {template.estimatedDifficulty}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {template.estimatedTimeframe}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  )
}
