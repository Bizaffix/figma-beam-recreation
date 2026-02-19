import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { QuizQuestion, QuizAnswers } from "@/data/retreater-personality";
import { QUIZ_QUESTIONS } from "@/data/retreater-personality";

interface VibeQuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack: () => void;
}

export function VibeQuiz({ onComplete, onBack }: VibeQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const question = QUIZ_QUESTIONS[currentQ];
  const totalQuestions = QUIZ_QUESTIONS.length;

  const currentAnswer = answers[question.id];
  const isMulti = question.multiSelect;
  const selectedIds: string[] = isMulti
    ? (currentAnswer as string[]) || []
    : currentAnswer
      ? [currentAnswer as string]
      : [];

  const handleSelect = (optionId: string) => {
    if (isMulti) {
      const prev = (answers[question.id] as string[]) || [];
      const next = prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId];
      setAnswers({ ...answers, [question.id]: next });
    } else {
      setAnswers({ ...answers, [question.id]: optionId });
      // Auto-advance after single-select pick (slight delay for visual feedback)
      if (currentQ < totalQuestions - 1) {
        setTimeout(() => setCurrentQ(currentQ + 1), 300);
      }
    }
  };

  const canAdvance = isMulti
    ? selectedIds.length > 0
    : !!currentAnswer;

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Quick vibe check
        </h2>
        <p className="text-muted-foreground">
          {totalQuestions} questions, then we'll find your matches.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {QUIZ_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              i <= currentQ ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
          {currentQ + 1} of {totalQuestions}
        </span>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
          <span className="text-2xl">{question.emoji}</span>
          {question.title}
        </h3>
        <p className="text-muted-foreground text-sm">{question.subtitle}</p>
      </div>

      {/* Options */}
      <div className={`grid gap-3 mb-8 ${
        question.multiSelect ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
      }`}>
        {question.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md group ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                  : "border-border/60 bg-white hover:border-primary/40 hover:bg-primary/[0.02]"
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <span className="text-2xl mb-2 block">{option.emoji}</span>
              <h4 className={`font-semibold text-sm mb-1 ${
                isSelected ? "text-primary" : "text-foreground"
              }`}>
                {option.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {currentQ === 0 ? "Back to dream" : "Previous"}
        </Button>

        {(isMulti || currentQ === totalQuestions - 1) && (
          <Button
            onClick={handleNext}
            disabled={!canAdvance}
            className="bg-primary hover:bg-primary/90 px-6"
          >
            {currentQ === totalQuestions - 1 ? (
              <>
                See my personality
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
