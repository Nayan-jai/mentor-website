/**
 * OMR Processing Library
 * Handles image processing to extract answers from OMR sheets
 */

export interface OMRAnswer {
  questionNumber: number;
  selectedOption: string | null; // 'a', 'b', 'c', 'd' or null for unattempted
  confidence: number; // 0-1 confidence score
}

export interface OMRProcessingResult {
  answers: OMRAnswer[];
  processingSuccess: boolean;
  errorMessage?: string;
  totalQuestions: number;
  attemptedQuestions: number;
}

export interface OMRTemplate {
  questionsPerPage: number;
  optionsPerQuestion: number;
  questionRows: number;
  questionCols: number;
  bubbleRadius: number;
  pageMargins: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  questionSpacing: {
    vertical: number;
    horizontal: number;
  };
  optionSpacing: number;
}

// Default OMR template configuration
export const DEFAULT_OMR_TEMPLATE: OMRTemplate = {
  questionsPerPage: 50,
  optionsPerQuestion: 4,
  questionRows: 25,
  questionCols: 2,
  bubbleRadius: 12,
  pageMargins: {
    top: 100,
    left: 80,
    right: 80,
    bottom: 100,
  },
  questionSpacing: {
    vertical: 35,
    horizontal: 300,
  },
  optionSpacing: 35,
};

/**
 * Process OMR sheet image and extract answers
 */
export class OMRProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private template: OMRTemplate;

  constructor(template: OMRTemplate = DEFAULT_OMR_TEMPLATE) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.template = template;
  }

  /**
   * Process uploaded OMR sheet file
   */
  async processOMRSheet(file: File, totalQuestions: number): Promise<OMRProcessingResult> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        throw new Error('Invalid file format. Please upload a clear image (JPG, PNG) of your OMR sheet.');
      }
      
      const image = await this.loadImage(file);
      const answers = await this.extractAnswers(image, totalQuestions);
      
      return {
        answers,
        processingSuccess: true,
        totalQuestions,
        attemptedQuestions: answers.filter(a => a.selectedOption !== null).length,
      };
    } catch (error) {
      console.error('OMR processing error:', error);
      return {
        answers: [],
        processingSuccess: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to process OMR sheet',
        totalQuestions,
        attemptedQuestions: 0,
      };
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > maxSize) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Load image file and return HTMLImageElement
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image. Please ensure the image is clear and properly formatted.'));
      };
      
      img.src = url;
    });
  }

  /**
   * Extract answers from processed image
   */
  private async extractAnswers(image: HTMLImageElement, totalQuestions: number): Promise<OMRAnswer[]> {
    // Set canvas size to match image
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    
    // Draw image on canvas
    this.ctx.drawImage(image, 0, 0);
    
    // Convert to grayscale for better processing
    this.preprocessImage();
    
    const answers: OMRAnswer[] = [];
    const pagesNeeded = Math.ceil(totalQuestions / this.template.questionsPerPage);
    
    for (let page = 0; page < pagesNeeded; page++) {
      const pageAnswers = await this.extractPageAnswers(page, totalQuestions);
      answers.push(...pageAnswers);
    }
    
    return answers.slice(0, totalQuestions);
  }

  /**
   * Preprocess image for better bubble detection
   */
  private preprocessImage(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Enhance contrast for better bubble detection
      const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha channel remains unchanged
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Extract answers from a specific page
   */
  private async extractPageAnswers(pageIndex: number, totalQuestions: number): Promise<OMRAnswer[]> {
    const answers: OMRAnswer[] = [];
    const startQuestion = pageIndex * this.template.questionsPerPage + 1;
    const endQuestion = Math.min(startQuestion + this.template.questionsPerPage - 1, totalQuestions);
    
    for (let qNum = startQuestion; qNum <= endQuestion; qNum++) {
      const questionIndex = qNum - startQuestion;
      const row = Math.floor(questionIndex / this.template.questionCols);
      const col = questionIndex % this.template.questionCols;
      
      const questionPosition = this.calculateQuestionPosition(row, col);
      const result = await this.detectSelectedOption(questionPosition, qNum);
      
      answers.push({
        questionNumber: qNum,
        selectedOption: result.option,
        confidence: result.confidence,
      });
    }
    
    return answers;
  }

  /**
   * Calculate the position of a question on the page
   */
  private calculateQuestionPosition(row: number, col: number) {
    return {
      x: this.template.pageMargins.left + (col * this.template.questionSpacing.horizontal),
      y: this.template.pageMargins.top + (row * this.template.questionSpacing.vertical),
    };
  }

  /**
   * Detect which option is selected for a question with improved accuracy
   */
  private async detectSelectedOption(position: { x: number; y: number }, questionNumber: number): Promise<{ option: string | null; confidence: number }> {
    const options = ['a', 'b', 'c', 'd'];
    const optionScores: { option: string; darkness: number; filled: boolean }[] = [];
    
    // Analyze each option bubble
    for (let i = 0; i < options.length; i++) {
      const optionX = position.x + (i * this.template.optionSpacing);
      const optionY = position.y;
      
      const analysis = this.analyzeBubble(optionX, optionY);
      
      optionScores.push({
        option: options[i],
        darkness: analysis.darkness,
        filled: analysis.isFilled,
      });
    }
    
    // Find the most likely selected option
    const filledOptions = optionScores.filter(score => score.filled);
    
    if (filledOptions.length === 0) {
      return { option: null, confidence: 1.0 }; // High confidence in no selection
    }
    
    if (filledOptions.length === 1) {
      return { 
        option: filledOptions[0].option, 
        confidence: 0.9 // High confidence in single selection
      };
    }
    
    // Multiple selections detected - choose the darkest one but lower confidence
    const darkestOption = filledOptions.reduce((prev, current) => 
      current.darkness > prev.darkness ? current : prev
    );
    
    return { 
      option: darkestOption.option, 
      confidence: 0.6 // Lower confidence due to multiple selections
    };
  }

  /**
   * Analyze a bubble area with improved detection algorithm
   */
  private analyzeBubble(x: number, y: number): { darkness: number; isFilled: boolean } {
    const radius = this.template.bubbleRadius;
    const imageData = this.ctx.getImageData(
      Math.max(0, x - radius),
      Math.max(0, y - radius),
      radius * 2,
      radius * 2
    );
    
    let totalDarkness = 0;
    let darkPixelCount = 0;
    let totalPixelCount = 0;
    const centerX = radius;
    const centerY = radius;
    
    // Analyze pixels in a circular pattern
    for (let py = 0; py < radius * 2; py++) {
      for (let px = 0; px < radius * 2; px++) {
        const distance = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
        
        // Only analyze pixels within the bubble circle
        if (distance <= radius) {
          const pixelIndex = (py * radius * 2 + px) * 4;
          
          if (pixelIndex + 2 < imageData.data.length) {
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            
            // Convert to grayscale
            const grayscale = (r + g + b) / 3;
            const darkness = 1 - (grayscale / 255);
            
            totalDarkness += darkness;
            totalPixelCount++;
            
            // Count pixels that are significantly dark (likely filled)
            if (darkness > 0.4) {
              darkPixelCount++;
            }
          }
        }
      }
    }
    
    const averageDarkness = totalPixelCount > 0 ? totalDarkness / totalPixelCount : 0;
    const darkPixelRatio = totalPixelCount > 0 ? darkPixelCount / totalPixelCount : 0;
    
    // Determine if bubble is filled based on darkness and coverage
    const isFilled = averageDarkness > 0.35 && darkPixelRatio > 0.3;
    
    return {
      darkness: averageDarkness,
      isFilled,
    };
  }

  /**
   * Generate OMR template for a given number of questions
   */
  static generateOMRTemplate(totalQuestions: number, template: OMRTemplate = DEFAULT_OMR_TEMPLATE): string {
    const pagesNeeded = Math.ceil(totalQuestions / template.questionsPerPage);
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842">
  <defs>
    <style>
      .question-number { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; }
      .option-label { font-family: Arial, sans-serif; font-size: 10px; }
      .bubble { fill: none; stroke: #000; stroke-width: 1.5; }
      .instructions { font-family: Arial, sans-serif; font-size: 10px; }
      .calibration { fill: #000; }
      .header { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
      .guidelines { font-family: Arial, sans-serif; font-size: 9px; fill: #666; }
    </style>
  </defs>
  
  <!-- Calibration marks for image processing -->
  <circle cx="30" cy="30" r="5" class="calibration"/>
  <circle cx="565" cy="30" r="5" class="calibration"/>
  <circle cx="30" cy="812" r="5" class="calibration"/>
  <circle cx="565" cy="812" r="5" class="calibration"/>`;

    for (let page = 0; page < pagesNeeded; page++) {
      svg += this.generatePageTemplate(page, totalQuestions, template);
    }

    svg += '</svg>';
    return svg;
  }

  private static generatePageTemplate(pageIndex: number, totalQuestions: number, template: OMRTemplate): string {
    const startQuestion = pageIndex * template.questionsPerPage + 1;
    const endQuestion = Math.min(startQuestion + template.questionsPerPage - 1, totalQuestions);
    const pageOffset = pageIndex * 842; // A4 height in points
    
    let pageContent = `<g transform="translate(0, ${pageOffset})">
      <!-- Page Header -->
      <rect x="0" y="0" width="595" height="842" fill="none" stroke="#ccc" stroke-width="1"/>
      <text x="297" y="25" text-anchor="middle" class="header">OMR Answer Sheet - Page ${pageIndex + 1}</text>
      
      <!-- Instructions -->
      <text x="50" y="45" class="instructions">Instructions: Fill the bubbles completely with a dark pen/pencil. Use only one answer per question.</text>
      <text x="50" y="58" class="instructions">Questions ${startQuestion} - ${endQuestion}</text>
      <text x="50" y="71" class="guidelines">⚫ Correct filling    ◯ Wrong filling    ⚫ Do not make stray marks</text>
      
      <!-- Answer Grid Header -->
      <line x1="${template.pageMargins.left - 40}" y1="85" x2="${595 - template.pageMargins.right}" y2="85" stroke="#000" stroke-width="1"/>
      
      <!-- Questions Grid -->`

    for (let qNum = startQuestion; qNum <= endQuestion; qNum++) {
      const questionIndex = qNum - startQuestion;
      const row = Math.floor(questionIndex / template.questionCols);
      const col = questionIndex % template.questionCols;
      
      const x = template.pageMargins.left + (col * template.questionSpacing.horizontal);
      const y = template.pageMargins.top + (row * template.questionSpacing.vertical);
      
      pageContent += `
        <!-- Question ${qNum} -->
        <text x="${x - 25}" y="${y + 5}" class="question-number">${qNum}.</text>`;
      
      // Add option bubbles
      for (let i = 0; i < template.optionsPerQuestion; i++) {
        const optionX = x + (i * template.optionSpacing);
        const optionLabel = String.fromCharCode(97 + i); // 'a', 'b', 'c', 'd'
        
        pageContent += `
          <circle cx="${optionX}" cy="${y}" r="${template.bubbleRadius}" class="bubble"/>
          <text x="${optionX - 3}" y="${y + 4}" class="option-label">${optionLabel}</text>`;
      }
    }
    
    pageContent += '</g>';
    return pageContent;
  }
}

/**
 * Simulate OMR processing for demo purposes
 * In production, this would be replaced with actual image processing
 */
export function simulateOMRProcessing(totalQuestions: number): OMRProcessingResult {
  const answers: OMRAnswer[] = [];
  
  for (let i = 1; i <= totalQuestions; i++) {
    // Randomly simulate attempted/unattempted questions
    const isAttempted = Math.random() > 0.1; // 90% attempt rate
    
    answers.push({
      questionNumber: i,
      selectedOption: isAttempted ? ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)] : null,
      confidence: isAttempted ? 0.8 + (Math.random() * 0.2) : 1.0,
    });
  }
  
  return {
    answers,
    processingSuccess: true,
    totalQuestions,
    attemptedQuestions: answers.filter(a => a.selectedOption !== null).length,
  };
}