import { pb } from '@/services/pocketbase/client'
import type { Question, RoundQuestion } from '@/types'

class QuestionService {
  /**
   * Get questions by category with pagination
   */
  async getQuestionsByCategory(category: string, page = 1, perPage = 50): Promise<Question[]> {
    try {
      const result = await pb.collection('questions').getList(page, perPage, {
        filter: `category = "${category}"`,
        sort: 'created_at'
      })

      return result.items as unknown as Question[]
    } catch (error) {
      throw new Error(`Failed to get questions for category ${category}: ${error}`)
    }
  }

  /**
   * Get random questions for categories
   */
  async getRandomQuestions(categories: string[], count: number): Promise<Question[]> {
    try {
      const categoryFilter = categories.map(cat => `category = "${cat}"`).join(' || ')
      const result = await pb.collection('questions').getList(1, count * 3, {
        filter: categoryFilter,
        sort: 'RANDOM()' // Note: RANDOM() may not be available in all PocketBase versions
      })

      // Shuffle and select the requested number of questions
      const shuffled = this.shuffleArray(result.items as unknown as Question[])
      return shuffled.slice(0, count)
    } catch (error) {
      throw new Error(`Failed to get random questions: ${error}`)
    }
  }

  /**
   * Add questions to a round
   */
  async addQuestionsToRound(roundId: string, questionIds: string[]): Promise<RoundQuestion[]> {
    try {
      const roundQuestions: RoundQuestion[] = []

      for (let i = 0; i < questionIds.length; i++) {
        const roundQuestionData = {
          round_id: roundId,
          question_id: questionIds[i],
          question_number: i + 1,
          shuffle_seed: Math.floor(Math.random() * 1000000),
          created_at: new Date().toISOString()
        }

        const roundQuestion = await pb.collection('round_questions').create(roundQuestionData)
        roundQuestions.push(roundQuestion as unknown as RoundQuestion)
      }

      return roundQuestions
    } catch (error) {
      throw new Error(`Failed to add questions to round: ${error}`)
    }
  }

  /**
   * Get questions for a round with populated question data
   */
  async getRoundQuestions(roundId: string): Promise<RoundQuestion[]> {
    try {
      const result = await pb.collection('round_questions').getFullList({
        filter: `round_id = "${roundId}"`,
        sort: 'question_number',
        expand: 'question_id'
      })

      return result.map(item => ({
        ...item,
        question: item.expand?.question_id as Question
      })) as unknown as RoundQuestion[]
    } catch (error) {
      throw new Error(`Failed to get round questions: ${error}`)
    }
  }

  /**
   * Get question with shuffled answers for display
   */
  async getQuestionForDisplay(roundQuestionId: string): Promise<{
    question: string;
    answers: string[];
    correctAnswer: string;
  }> {
    try {
      const roundQuestion = await pb.collection('round_questions').getOne(roundQuestionId, {
        expand: 'question_id'
      }) as any

      const question = roundQuestion.expand?.question_id as Question

      if (!question) {
        throw new Error('Question not found')
      }

      // Shuffle answers deterministically based on shuffle_seed
      const answers = [
        question.a,
        question.b,
        question.c,
        question.d
      ]

      const shuffledAnswers = this.shuffleAnswers(answers, roundQuestion.shuffle_seed)

      return {
        question: question.question,
        answers: shuffledAnswers,
        correctAnswer: question.a
      }
    } catch (error) {
      throw new Error(`Failed to get question for display: ${error}`)
    }
  }

  /**
   * Get available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const result = await pb.collection('questions').getFirstListItem('', {
        fields: 'category'
      })

      // This is a simplified approach - in production you'd want a dedicated endpoint
      // or use aggregate functions to get distinct categories
      const questions = await pb.collection('questions').getFullList({
        fields: 'category'
      })

      const categories = [...new Set((questions as unknown as Question[]).map(q => q.category))]
      return categories.sort()
    } catch (error) {
      throw new Error(`Failed to get available categories: ${error}`)
    }
  }

  /**
   * Check if questions have been used by a host
   */
  async getUnusedQuestions(hostId: string, categories: string[], limit = 100): Promise<Question[]> {
    try {
      // First get used question IDs for this host
      const usedQuestions = await pb.collection('used_questions').getFullList({
        filter: `host_id = "${hostId}"`
      })

      const usedQuestionIds = usedQuestions.map(uq => uq.question_id)

      // Then get unused questions from the requested categories
      const categoryFilter = categories.map(cat => `category = "${cat}"`).join(' || ')
      const usedFilter = usedQuestionIds.length > 0
        ? `(${categoryFilter}) && !(${usedQuestionIds.map(id => `id = "${id}"`).join(' || ')})`
        : categoryFilter

      const result = await pb.collection('questions').getList(1, limit, {
        filter: usedFilter,
        sort: 'RANDOM()'
      })

      return result.items as unknown as Question[]
    } catch (error) {
      throw new Error(`Failed to get unused questions: ${error}`)
    }
  }

  /**
   * Mark questions as used by a host
   */
  async markQuestionsAsUsed(hostId: string, questionIds: string[]): Promise<void> {
    try {
      for (const questionId of questionIds) {
        await pb.collection('used_questions').create({
          host_id: hostId,
          question_id: questionId,
          used_at: new Date().toISOString()
        })
      }
    } catch (error) {
      throw new Error(`Failed to mark questions as used: ${error}`)
    }
  }

  /**
   * Utility: Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Utility: Shuffle answers deterministically based on seed
   */
  private shuffleAnswers(answers: string[], seed: number): string[] {
    // Simple seeded shuffle - in production you might want a more robust approach
    const shuffled = [...answers]
    let rng = seed

    for (let i = shuffled.length - 1; i > 0; i--) {
      rng = (rng * 9301 + 49297) % 233280
      const j = Math.floor((rng / 233280) * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }
}

export const questionService = new QuestionService()
export default questionService