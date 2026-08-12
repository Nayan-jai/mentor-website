export interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
}

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
    }));
  }

  public speak(
    text: string,
    options?: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!this.synth) {
      options?.onError?.(new Error('Speech synthesis not supported in this browser.'));
      return;
    }

    this.stop();

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    if (options?.voiceName) {
      const selectedVoice = this.voices.find((v) => v.name === options.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    if (options?.onError) {
      utterance.onerror = options.onError;
    }

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

/**
 * Generate step explanation AI script based on target element details.
 */
export function generateAiStepNarration(elementName: string, actionType: string): string {
  const cleanName = elementName.trim() || 'this section';
  switch (actionType) {
    case 'click':
      return `Click on ${cleanName} to proceed to the next step.`;
    case 'input':
      return `Enter your details into ${cleanName} to continue.`;
    case 'hover':
      return `Hover over ${cleanName} to reveal additional options.`;
    case 'scroll':
      return `Scroll down to view ${cleanName}.`;
    default:
      return `Take a look at ${cleanName}. Here you can find key features and options.`;
  }
}
