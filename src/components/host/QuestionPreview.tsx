import React from 'react'
import type { Question } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shuffle, Eye, EyeOff } from 'lucide-react'

interface QuestionPreviewProps {
  questions: Question[]
  showAnswers?: boolean
  onToggleAnswers?: () => void
  onShuffle?: () => void
  className?: string
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  questions,
  showAnswers = false,
  onToggleAnswers,
  onShuffle,
  className = ''
}) => {
  if (questions.length === 0) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          <p>No questions selected yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Question Preview ({questions.length} questions)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShuffle}
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Shuffle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAnswers}
              className="flex items-center gap-2"
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Q{index + 1}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {question.category}
                  </Badge>
                  {question.metadata?.difficulty && (
                    <Badge
                      variant={
                        question.metadata.difficulty === 'easy' ? 'default' :
                        question.metadata.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {question.metadata.difficulty}
                    </Badge>
                  )}
                </div>
              </div>

              <p className="font-medium mb-3">{question.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'A', text: question.a, correct: true },
                  { label: 'B', text: question.b, correct: false },
                  { label: 'C', text: question.c, correct: false },
                  { label: 'D', text: question.d, correct: false }
                ].map((answer) => (
                  <div
                    key={answer.label}
                    className={`
                      p-2 rounded border text-sm
                      ${showAnswers && answer.correct
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <span className="font-medium">{answer.label}.</span> {answer.text}
                    {showAnswers && answer.correct && (
                      <span className="ml-2 text-xs font-bold text-green-600 dark:text-green-400">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {question.metadata?.source && (
                <p className="text-xs text-muted-foreground mt-2">
                  Source: {question.metadata.source}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default QuestionPreview