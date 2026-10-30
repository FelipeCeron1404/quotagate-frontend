export interface TokenEstimate {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export class TokenEstimator {
  private static readonly CHARACTERS_PER_TOKEN = 4

  estimateText(text: string): number {
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      return 0
    }
    return Math.max(1, Math.ceil(trimmed.length / TokenEstimator.CHARACTERS_PER_TOKEN))
  }

  estimateRequest(prompt: string, expectedCompletionTokens: number): TokenEstimate {
    const promptTokens = this.estimateText(prompt)
    const completionTokens = promptTokens === 0 ? 0 : expectedCompletionTokens
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens }
  }
}

export const tokenEstimator = new TokenEstimator()
