import type { PracticeCase } from "./practice-cases";

export interface PracticeDraft { version: 1; answers: Record<string, string>; checked: number[] }

export function readPracticeDraft(raw: string | null, lesson: PracticeCase): PracticeDraft {
  const empty: PracticeDraft = { version: 1, answers: {}, checked: [] };
  if (!raw) return empty;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return empty;
    const draft = value as Partial<PracticeDraft>;
    if (draft.version !== 1 || !draft.answers || typeof draft.answers !== "object" || Array.isArray(draft.answers)) return empty;
    const answers = Object.fromEntries(lesson.worksheet.flatMap(({ id }) => typeof draft.answers?.[id] === "string"
      ? [[id, draft.answers[id].slice(0, 4000)]] : []));
    const checked = Array.isArray(draft.checked) ? [...new Set(draft.checked.filter((n) => Number.isInteger(n) && n >= 0 && n < lesson.rubric.length))] : [];
    return { version: 1, answers, checked };
  } catch { return empty; }
}

export function exportPracticeWorkbook(lesson: PracticeCase, draft: PracticeDraft): string {
  return [
    `# ${lesson.title} — 나의 실습 기록`,
    "가상 사례를 이용한 자가 연습입니다. 공인 평가나 수료 인증이 아닙니다.",
    `목표: ${lesson.outcome}`,
    ...lesson.worksheet.map((field) => `## ${field.label}\n\n${draft.answers[field.id]?.trim() || '(아직 작성하지 않음)'}`),
    `## 스스로 확인하기\n\n${lesson.rubric.map((line, i) => `- [${draft.checked.includes(i) ? 'x' : ' '}] ${line}`).join('\n')}`,
    `## 한 걸음 더\n\n${lesson.nextChallenge}`,
    `## 참고 자료\n\n${lesson.sources.map((source) => `### ${source.id} · ${source.title}\n\n${source.body}`).join('\n\n')}`,
    `## 개념 참고\n\n${lesson.references.map((ref) => `- [${ref.title}](${ref.url})`).join('\n')}`,
  ].join("\n\n") + "\n";
}
