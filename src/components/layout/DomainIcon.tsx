import { Activity, Bot, BrainCircuit, ChartColumn, ClipboardList, FlaskConical, Target, Workflow, Blocks, BookOpen, Cloud, Code2, Cpu, Database, GitBranch, HardDrive, Network, Server, ShieldCheck } from "lucide-react";

const icons = { Activity, Bot, BrainCircuit, ChartColumn, ClipboardList, FlaskConical, Target, Workflow, Cpu, HardDrive, Network, GitBranch, Code2, Blocks, Database, Server, Cloud, ShieldCheck };

export function DomainIcon({ name, className = "size-4" }: { name?: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? BookOpen;
  return <Icon aria-hidden="true" className={className} />;
}

const shortNames: Record<string, string> = {
  hardware: "컴퓨터 기초", "operating-systems": "운영체제", networks: "네트워크", algorithms: "자료구조·알고리즘",
  languages: "프로그래밍 언어", engineering: "소프트웨어 설계", databases: "데이터베이스", "distributed-systems": "백엔드·분산 시스템",
  "cloud-devops": "클라우드·DevOps", "web-security-ai": "웹·보안", "data-analytics": "데이터 분석", "ai-machine-learning": "AI·머신러닝",
  "deep-learning": "딥러닝", "generative-ai": "생성형 AI", "ai-engineering": "AI 앱·업무 자동화", "mlops-responsible-ai": "AI 운영·책임",
  "project-management": "프로젝트 관리", "product-business": "제품·UX·업무 전략",
};

export function domainLabel(slug: string, title: string) { return shortNames[slug] ?? title; }
