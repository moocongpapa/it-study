import type { Edge, Node } from "@xyflow/react";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export interface Domain {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  created_at: string;
}

export interface Topic {
  id: string;
  domain_id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  display_order: number;
  created_at: string;
}

export interface TopicPrerequisite {
  id: number;
  from_topic_id: string;
  to_topic_id: string;
  created_at: string;
}

export interface Article {
  id: string;
  topic_id: string;
  level_1_mental_model: string | null;
  level_2_core_engineering: string | null;
  level_3_troubleshooting: string | null;
  level_4_architecture_tradeoffs: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  topic_id: string;
  level: 1 | 2 | 3 | 4;
  question: string;
  choices: string[];
  question_type: "multiple_choice" | "short_answer";
}

export interface QuizFeedback {
  passed: boolean;
  correctAnswer: string;
  explanation: string;
  progress?: TopicProgressResult;
}

export interface TopicProgressResult {
  isCompleted: boolean;
  currentLevel: number;
  nextReviewAt: string | null;
  unlockedTopicIds: string[];
}

export interface UserNodeProgress {
  topic_id: string;
  is_completed: boolean;
  current_level: number;
  self_assessment: number | null;
  completed_at: string | null;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  review_interval_days?: number;
  ease_factor?: number;
  review_count?: number;
}

export interface TopicNodeData extends Record<string, unknown> {
  topic: Topic;
  status: TopicStatus;
  unmetPrerequisites: number;
  onOpen?: (topicId: string) => void;
}

export type TopicFlowNode = Node<TopicNodeData, "topic">;
export type TopicFlowEdge = Edge;

export interface Catalog {
  domains: Domain[];
  topics: Topic[];
  prerequisites: TopicPrerequisite[];
  progress: UserNodeProgress[];
  userId: string | null;
  isDemo: boolean;
}

export interface DomainSummary extends Domain {
  topicCount: number;
  completedCount: number;
}
