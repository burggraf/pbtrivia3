import type { SoundEffect, SoundConfig } from '@/types'

class SoundService {
  private audioContext: AudioContext | null = null
  private sounds: Map<SoundEffect, AudioBuffer> = new Map()
  private config: SoundConfig = {
    enabled: true,
    volume: 0.7
  }
  private isInitialized = false
  private pendingSounds: Set<string> = new Set()

  /**
   * Initialize the audio context and load sounds
   */
  async initialize(config?: Partial<SoundConfig>): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Create audio context (requires user interaction in some browsers)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Update configuration
      if (config) {
        this.config = { ...this.config, ...config }
      }

      // Load sound effects
      await this.loadSounds()

      this.isInitialized = true
      console.log('Sound service initialized')
    } catch (error) {
      console.warn('Failed to initialize sound service:', error)
      this.config.enabled = false
    }
  }

  /**
   * Load all sound effects
   */
  private async loadSounds(): Promise<void> {
    const soundFiles: Record<SoundEffect, string> = {
      'game_start': '/sounds/game-start.mp3',
      'round_start': '/sounds/round-start.mp3',
      'question_appear': '/sounds/question-appear.mp3',
      'answer_submit': '/sounds/answer-submit.mp3',
      'correct_answer': '/sounds/correct-answer.mp3',
      'wrong_answer': '/sounds/wrong-answer.mp3',
      'timer_warning': '/sounds/timer-warning.mp3',
      'times_up': '/sounds/times-up.mp3',
      'round_complete': '/sounds/round-complete.mp3',
      'game_complete': '/sounds/game-complete.mp3',
      'button_click': '/sounds/button-click.mp3',
      'notification': '/sounds/notification.mp3'
    }

    // Load sounds in parallel
    const loadPromises = Object.entries(soundFiles).map(async ([effect, url]) => {
      try {
        const audioBuffer = await this.loadSound(url)
        this.sounds.set(effect as SoundEffect, audioBuffer)
      } catch (error) {
        console.warn(`Failed to load sound ${effect}:`, error)
      }
    })

    await Promise.allSettled(loadPromises)
  }

  /**
   * Load a single sound file
   */
  private async loadSound(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch sound: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  /**
   * Play a sound effect
   */
  async playSound(effect: SoundEffect, options?: {
    volume?: number
    pitch?: number
    loop?: boolean
  }): Promise<void> {
    if (!this.config.enabled || !this.isInitialized || !this.audioContext) {
      return
    }

    const audioBuffer = this.sounds.get(effect)
    if (!audioBuffer) {
      console.warn(`Sound not loaded: ${effect}`)
      return
    }

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create audio source
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = this.config.volume * (options?.volume || 1)

      // Apply pitch adjustment if specified
      if (options?.pitch && options.pitch !== 1) {
        source.playbackRate.value = options.pitch
      }

      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Handle looping
      if (options?.loop) {
        source.loop = true
      }

      // Start playing
      source.start(0)

      // Clean up after playing (for non-looping sounds)
      if (!options?.loop) {
        source.onended = () => {
          source.disconnect()
          gainNode.disconnect()
        }
      }
    } catch (error) {
      console.warn(`Failed to play sound ${effect}:`, error)
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds(): void {
    if (!this.audioContext) {
      return
    }

    // Create a new audio context to stop all sounds (brute force approach)
    this.audioContext.close().catch(() => {
      // Ignore errors during cleanup
    })

    // Recreate audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  /**
   * Update sound configuration
   */
  updateConfig(config: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...config }

    // If sounds are disabled, stop all currently playing sounds
    if (!config.enabled) {
      this.stopAllSounds()
    }
  }

  /**
   * Get current sound configuration
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /**
   * Check if a specific sound is loaded
   */
  isSoundLoaded(effect: SoundEffect): boolean {
    return this.sounds.has(effect)
  }

  /**
   * Get list of loaded sounds
   */
  getLoadedSounds(): SoundEffect[] {
    return Array.from(this.sounds.keys())
  }

  /**
   * Preload a specific sound
   */
  async preloadSound(effect: SoundEffect): Promise<void> {
    if (this.sounds.has(effect)) {
      return // Already loaded
    }

    const soundUrl = this.getSoundUrl(effect)
    if (!soundUrl) {
      return
    }

    try {
      const audioBuffer = await this.loadSound(soundUrl)
      this.sounds.set(effect, audioBuffer)
    } catch (error) {
      console.warn(`Failed to preload sound ${effect}:`, error)
    }
  }

  /**
   * Get URL for a sound effect
   */
  private getSoundUrl(effect: SoundEffect): string | null {
    const soundUrls: Record<SoundEffect, string> = {
      'game_start': '/sounds/game-start.mp3',
      'round_start': '/sounds/round-start.mp3',
      'question_appear': '/sounds/question-appear.mp3',
      'answer_submit': '/sounds/answer-submit.mp3',
      'correct_answer': '/sounds/correct-answer.mp3',
      'wrong_answer': '/sounds/wrong-answer.mp3',
      'timer_warning': '/sounds/timer-warning.mp3',
      'times_up': '/sounds/times-up.mp3',
      'round_complete': '/sounds/round-complete.mp3',
      'game_complete': '/sounds/game-complete.mp3',
      'button_click': '/sounds/button-click.mp3',
      'notification': '/sounds/notification.mp3'
    }

    return soundUrls[effect] || null
  }

  /**
   * Play a sequence of sounds with delays
   */
  async playSoundSequence(
    sounds: Array<{
      effect: SoundEffect
      delay?: number
      options?: any
    }>
  ): Promise<void> {
    for (const { effect, delay = 0, options } of sounds) {
      if (delay > 0) {
        await this.wait(delay)
      }
      await this.playSound(effect, options)
    }
  }

  /**
   * Wait for a specified amount of time
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a simple tone (fallback for missing sound files)
   */
  playTone(frequency: number, duration: number, volume = 0.1): void {
    if (!this.config.enabled || !this.isInitialized || !this.audioContext) {
      return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.value = volume * this.config.volume
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      )

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.warn('Failed to play tone:', error)
    }
  }

  /**
   * Play system notification sound using Web Audio API as fallback
   */
  playSystemNotification(): void {
    // Try to play a notification tone as fallback
    this.playTone(800, 200, 0.1)
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopAllSounds()
    this.sounds.clear()
    this.isInitialized = false
  }
}

// Create singleton instance
export const soundService = new SoundService()

// Convenience functions for common sounds
export const playGameStart = () => soundService.playSound('game_start')
export const playRoundStart = () => soundService.playSound('round_start')
export const playQuestionAppear = () => soundService.playSound('question_appear')
export const playAnswerSubmit = () => soundService.playSound('answer_submit')
export const playCorrectAnswer = () => soundService.playSound('correct_answer')
export const playWrongAnswer = () => soundService.playSound('wrong_answer')
export const playTimerWarning = () => soundService.playSound('timer_warning')
export const playTimesUp = () => soundService.playSound('times_up')
export const playRoundComplete = () => soundService.playSound('round_complete')
export const playGameComplete = () => soundService.playSound('game_complete')
export const playButtonClick = () => soundService.playSound('button_click')
export const playNotification = () => soundService.playSound('notification')

// Export the service class and default instance
export default soundService