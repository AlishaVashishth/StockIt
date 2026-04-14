import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { courseData } from '../data/courseData';
import CongratsModal from '../components/CongratsModal';
import {
  getNextIncompleteItem,
  isCourseComplete,
  isItemComplete,
  markItemComplete,
} from '../utils/progressUtils';
import { addXP, calculateQuizXP, XP_VALUES } from '../utils/xpUtils';
import { fireMissionEvent } from '../utils/missionEngine';
import { addRecentActivity } from '../utils/activityUtils';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function LessonOrQuizPage() {
  const navigate = useNavigate();
  const { moduleId, lessonId } = useParams();
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizXpEarned, setQuizXpEarned] = useState(0);

  const module = useMemo(() => courseData.find((m) => m.id === moduleId), [moduleId]);

  const item = useMemo(() => {
    if (!module) return null;
    if (lessonId) return module.lessons.find((l) => l.id === lessonId) || null;
    const firstIncomplete = module.lessons.find((l) => !isItemComplete(l.id));
    return firstIncomplete || module.lessons[0] || null;
  }, [module, lessonId]);

  if (!module || !item) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        Content not found.
      </div>
    );
  }

  const currentLessonId = item.id;
  const alreadyCompleted = isItemComplete(currentLessonId);

  function gotoNextIncompleteOrCongrats() {
    if (isCourseComplete(courseData)) {
      setShowCongrats(true);
      return;
    }
    const next = getNextIncompleteItem(courseData);
    if (next) navigate(`/learn/${next.module.id}/${next.lesson.id}`);
  }

  function handleComplete() {
    const wasCompleted = isItemComplete(currentLessonId);
    markItemComplete(currentLessonId);
    if (!wasCompleted) {
      addXP(XP_VALUES.lesson_complete, `Completed lesson: ${item.title}`);
      addRecentActivity(`Completed Lesson: ${item.title}`);
      fireMissionEvent("lesson_complete", { lessonId: currentLessonId });
      fireMissionEvent("learning_day");
    }
    const moduleDone = module.lessons.every((l) => isItemComplete(l.id));
    if (moduleDone) {
      const completedModules = JSON.parse(localStorage.getItem("completedModules") || "[]");
      if (!completedModules.includes(module.id)) {
        completedModules.push(module.id);
        localStorage.setItem("completedModules", JSON.stringify(completedModules));
        fireMissionEvent("module_complete", { moduleId: module.id });
      }
    }
    gotoNextIncompleteOrCongrats();
  }

  const questions: Question[] = item.type === 'quiz' ? item.questions || [] : [];
  const score = quizSubmitted
    ? questions.reduce((acc, q, idx) => (selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc), 0)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-8">
      <div className="h-[60px] flex items-center px-4 border-b border-border">
        <button onClick={() => navigate('/learn')} className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <div className="ml-2 text-sm font-mono text-text-muted">{module.title}</div>
      </div>

      <div className="max-w-[390px] mx-auto p-4">
        {alreadyCompleted && (
          <div className="mb-4 bg-accent-green/15 border border-accent-green text-accent-green rounded-xl px-3 py-2 text-sm font-bold">
            ✓ Already Completed
          </div>
        )}

        <h1 className="text-2xl font-heading font-bold mb-4">{item.title}</h1>

        {item.type === 'lesson' ? (
          <>
            <div className="bg-bg-card border border-border rounded-xl p-4 text-sm leading-relaxed">
              {item.content}
            </div>
            <button
              onClick={handleComplete}
              className="mt-4 w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold"
            >
              Mark Complete & Continue
            </button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-bg-card border border-border rounded-xl p-4">
                  <p className="font-bold mb-3">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [qIdx]: option,
                          }))
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg border ${
                          selectedAnswers[qIdx] === option
                            ? 'border-accent-gold text-accent-gold'
                            : 'border-border text-text-primary'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted ? (
              <button
                onClick={() => {
                  const correctCount = questions.reduce(
                    (acc, q, idx) => (selectedAnswers[idx] === q.correctAnswer ? acc + 1 : acc),
                    0
                  );
                  const scorePercent = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
                  setQuizSubmitted(true);
                  const wasCompleted = isItemComplete(currentLessonId);
                  markItemComplete(currentLessonId);
                  const xpEarned = calculateQuizXP(scorePercent);
                  setQuizXpEarned(xpEarned);
                  if (!wasCompleted) {
                    addXP(xpEarned, `Completed quiz: ${item.title} (${Math.round(scorePercent)}%)`);
                    addRecentActivity(`Completed Quiz: ${item.title} — earned ${xpEarned} XP`);
                    const scores = JSON.parse(localStorage.getItem("quizScores") || "[]");
                    scores.push(scorePercent);
                    localStorage.setItem("quizScores", JSON.stringify(scores));
                    fireMissionEvent("quiz_complete", { score: scorePercent });
                    if (scorePercent >= 80) fireMissionEvent("quiz_score_80", { score: scorePercent });
                    if (scorePercent >= 100) fireMissionEvent("quiz_score_100", { score: scorePercent });
                    fireMissionEvent("learning_day");
                  }
                  const moduleDone = module.lessons.every((l) => isItemComplete(l.id));
                  if (moduleDone) {
                    const completedModules = JSON.parse(localStorage.getItem("completedModules") || "[]");
                    if (!completedModules.includes(module.id)) {
                      completedModules.push(module.id);
                      localStorage.setItem("completedModules", JSON.stringify(completedModules));
                      fireMissionEvent("module_complete", { moduleId: module.id });
                    }
                  }
                }}
                className="mt-4 w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold"
              >
                Submit Quiz
              </button>
            ) : (
              <div className="mt-4">
                <div className="mb-3 text-sm">
                  Score: <span className="font-bold">{score}/{questions.length}</span>
                </div>
                <div className="mb-3 text-sm text-accent-gold font-bold">
                  You earned +{quizXpEarned} XP!
                </div>
                {isCourseComplete(courseData) ? (
                  <button
                    onClick={() => setShowCongrats(true)}
                    className="w-full py-3 rounded-xl bg-accent-green text-bg-primary font-bold"
                  >
                    Finish Course
                  </button>
                ) : (
                  <button
                    onClick={gotoNextIncompleteOrCongrats}
                    className="w-full py-3 rounded-xl bg-accent-gold text-bg-primary font-bold"
                  >
                    Continue →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CongratsModal isOpen={showCongrats} onClose={() => setShowCongrats(false)} />
    </div>
  );
}
