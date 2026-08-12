'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Volume2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  Play,
  Square,
  Crosshair,
  Check,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  speechText: string;
  route: string;
  primarySelector?: string;
  fallbackSelectors?: string[];
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Mentor Learning Hub!',
    description: 'Your all-in-one platform connecting exam aspirants with expert mentors. Let us take a quick guided tour of key features.',
    speechText: 'Welcome to Mentor Learning Hub! Let us take a quick guided tour of the key features to help you get started.',
    route: '/',
    primarySelector: '[class*="from-slate-950/80"][class*="via-slate-900/40"], [class*="from-slate-950/80"], #hero-title, h1',
    fallbackSelectors: ['header', 'main'],
  },
  {
    id: 'sessions',
    title: '1-on-1 Session Booking',
    description: 'Book 1-on-1 mentorship slots with experienced toppers and mentors. Get personalized strategy advice and mock interview practice.',
    speechText: 'In the Sessions section, you can book 1-on-1 mentorship slots with toppers and expert mentors.',
    route: '/sessions',
    primarySelector: '[class*="border-l-blue"], [class*="border-l-4"], .rounded-3xl.p-6, .grid > div',
    fallbackSelectors: ['h2', 'h1', 'main'],
  },
  {
    id: 'sessions-test-create',
    title: 'Test Series & Mentor Tools',
    description: 'Access Test Series & OMR practice or create new mentorship session slots directly from the sessions hub.',
    speechText: 'Access Test Series and OMR practice, or create new mentorship sessions directly from here.',
    route: '/sessions',
    primarySelector: '[class*="self-auto"][class*="flex-wrap"], [class*="from-amber-500"], a[href="/test"], a[href="/sessions/create"]',
    fallbackSelectors: ['a[href="/test"]', 'button', 'h1', 'main'],
  },
  {
    id: 'forum-search',
    title: 'Interactive Discussion Forum',
    description: 'Ask questions, share notes, search topics, discuss previous year questions (PYQs), and collaborate with fellow aspirants.',
    speechText: 'Use the Discussion Forum to search topics, ask doubts, and explore discussions.',
    route: '/forum',
    primarySelector: 'input[placeholder*="Search"], .space-y-4 > div, article',
    fallbackSelectors: ['h2', 'h1', 'main'],
  },
  {
    id: 'forum-create',
    title: 'Create New Discussion',
    description: 'Click the Create Discussion button to start a new discussion thread, ask a doubt, or share study strategies with the community.',
    speechText: 'Click the Create Discussion button whenever you want to start a new discussion topic or ask a doubt.',
    route: '/forum',
    primarySelector: 'button.bg-blue-600, button[class*="bg-blue-600"], .bg-blue-600',
    fallbackSelectors: ['button', 'h2', 'h1', 'main'],
  },
  {
    id: 'resources',
    title: 'Study Resources & Notes',
    description: 'Access curated study material, topper notes, syllabus breakdowns, and preparation resources.',
    speechText: 'Explore curated study resources, topper notes, and preparation guides.',
    route: '/resources',
    primarySelector: '[class*="lg:col-span-2"], [class*="space-y-6"], .space-y-6, .grid > div:not(.col-span-full), .rounded-3xl',
    fallbackSelectors: ['h2', 'h1', 'main'],
  },
  {
    id: 'resources-upload',
    title: 'Upload & Share Notes',
    description: 'Upload your own study notes, summary sheets, and resources to share with fellow aspirants across the platform.',
    speechText: 'You can upload your own study notes and resources to share them with the community.',
    route: '/resources',
    primarySelector: '[class*="lg:col-span-1"], [class*="lg:sticky"], .lg\\:sticky, [class*="rounded-3xl"]',
    fallbackSelectors: ['form', 'button', 'h2', 'h1', 'main'],
  },
  {
    id: 'ask-mentor',
    title: 'Ask a Mentor Privately',
    description: 'Submit private 1-on-1 queries and doubts directly to expert mentors for personalized guidance.',
    speechText: 'In Ask a Mentor, you can send private queries and get personalized 1-on-1 answers directly from mentors.',
    route: '/my-queries?ask=true',
    primarySelector: '[class*="border-blue-200"], [class*="shadow-xl"], .shadow-xl.p-6, .border-blue-200, #ask-title, input[placeholder*="descriptive title"], form',
    fallbackSelectors: ['form', 'button', 'h2', 'h1', 'main'],
  },
  {
    id: 'study-tracker',
    title: 'Study Tracker & Calendar',
    description: 'Track daily progress, build custom or premade syllabi, set exam countdowns, and log your study hours.',
    speechText: 'In Study Tracker, track daily progress, syllabus completion, exam countdowns, and log your study hours.',
    route: '/dashboard/student/study-tracker',
    primarySelector: 'iframe, main, [class*="tracker"], button[title*="tour"], h1',
    fallbackSelectors: ['iframe', 'main', 'h1'],
  },
  {
    id: 'study-tracker-tour',
    title: 'Tracker Guided Tour',
    description: 'To know more about tracker completely, check out the guided tour by clicking "✨ Take a tour" in the header.',
    speechText: 'To know more about tracker completely, check out the guided tour by clicking Take a tour in the header.',
    route: '/dashboard/student/study-tracker',
    primarySelector: '#supademoBtn, button#supademoBtn',
    fallbackSelectors: ['#supademoBtn', '#menuBtn', '.hbtn-menu', 'iframe', 'main'],
  },
  {
    id: 'demo-summary',
    title: 'Guided Demo Hub & Overview',
    description: 'You are all set! You can relaunch this guided tour anytime from your student dashboard or top navigation bar.',
    speechText: 'You are all set to begin! You can relaunch this guided tour anytime from your dashboard.',
    route: '/dashboard/student',
    primarySelector: '[class*="from-cyan-400"][class*="to-sky-300"], [class*="shadow-cyan-500/20"], button[title*="Guided Tour"]',
    fallbackSelectors: ['button', 'main', 'h1'],
  },
];

interface OnboardingTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function OnboardingTour({ forceOpen = false, onClose }: OnboardingTourProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [navRect, setNavRect] = useState<DOMRect | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const updatePopover = () => {
      if (popoverRef.current) {
        setPopoverRect(popoverRef.current.getBoundingClientRect());
      }
    };
    updatePopover();
    const timer = setTimeout(updatePopover, 120);
    window.addEventListener('resize', updatePopover);
    window.addEventListener('scroll', updatePopover, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePopover);
      window.removeEventListener('scroll', updatePopover, true);
    };
  }, [isOpen, targetRect, currentStepIndex]);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Target Neerja, Prabhat, Swara, Madhur & any available Hindi (hi-IN) TTS voice
        const isTargetVoice = (v: SpeechSynthesisVoice) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return (
            name.includes('neerja') ||
            name.includes('neera') ||
            name.includes('prabhat') ||
            name.includes('prabahat') ||
            name.includes('swara') ||
            name.includes('madhur') ||
            lang.startsWith('hi') ||
            lang.includes('hi-in') ||
            lang.includes('hindi') ||
            name.includes('hindi') ||
            name.includes('हिन्दी')
          );
        };

        const matchedVoices = allVoices.filter(isTargetVoice);
        const finalVoices =
          matchedVoices.length > 0
            ? matchedVoices
            : allVoices.filter((v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en'));

        setAvailableVoices(finalVoices);

        const bestVoice =
          finalVoices.find((v) => v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('prabhat')) ||
          finalVoices[0];

        if (bestVoice) {
          setSelectedVoiceName((prev) => prev || bestVoice.name);
        }
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Inspector / Picker Mode state
  const [isInspectorMode, setIsInspectorMode] = useState(false);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pageLoadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or restore active tour session (auto-starts max 2 times for first-time logged in users)
  useEffect(() => {
    const isTourActive = typeof window !== 'undefined' && sessionStorage.getItem('tour_active') === 'true';
    const savedStepStr = typeof window !== 'undefined' ? sessionStorage.getItem('tour_step_index') : null;
    const tourViewsCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('onboarding_tour_views_count') || '0', 10) : 2;

    const shouldAutoStart = tourViewsCount < 2;

    if (forceOpen || isTourActive || shouldAutoStart) {
      if (shouldAutoStart && !isTourActive && !forceOpen) {
        localStorage.setItem('onboarding_tour_views_count', (tourViewsCount + 1).toString());
      }
      setIsOpen(true);
      const savedStep = savedStepStr !== null ? parseInt(savedStepStr, 10) : 0;
      const initialStep = isNaN(savedStep) ? 0 : Math.min(Math.max(0, savedStep), DEFAULT_TOUR_STEPS.length - 1);
      setCurrentStepIndex(initialStep);
      sessionStorage.setItem('tour_active', 'true');
      sessionStorage.setItem('tour_step_index', initialStep.toString());
    }

    const handleStartEvent = () => {
      stopAudio();
      sessionStorage.setItem('tour_active', 'true');
      sessionStorage.setItem('tour_step_index', '0');
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    const handleToggleInspector = () => {
      setIsInspectorMode((prev) => !prev);
    };

    window.addEventListener('start_onboarding_tour', handleStartEvent);
    window.addEventListener('toggle_element_inspector', handleToggleInspector);
    return () => {
      window.removeEventListener('start_onboarding_tour', handleStartEvent);
      window.removeEventListener('toggle_element_inspector', handleToggleInspector);
    };
  }, [forceOpen]);

  const currentStep = DEFAULT_TOUR_STEPS[currentStepIndex];

  // Helper to get CSS selector for any element
  const getCssSelector = (el: HTMLElement): string => {
    if (el.id) return `#${el.id}`;
    if (el.getAttribute('data-view')) return `button[data-view="${el.getAttribute('data-view')}"]`;
    if (el.getAttribute('href')) return `a[href="${el.getAttribute('href')}"]`;

    const cleanClasses = Array.from(el.classList)
      .filter((c) => !c.includes(':') && !c.startsWith('z-') && !c.startsWith('animate-'))
      .slice(0, 2)
      .join('.');

    if (cleanClasses) return `${el.tagName.toLowerCase()}.${cleanClasses}`;
    return el.tagName.toLowerCase();
  };

  // Inspector Mode Mouse Move & Click Listeners
  useEffect(() => {
    if (!isInspectorMode) {
      setHoveredRect(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('.pointer-events-auto')) return;
      const rect = target.getBoundingClientRect();
      setHoveredRect(rect);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('.pointer-events-auto')) return;
      e.preventDefault();
      e.stopPropagation();

      const selector = getCssSelector(target);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(selector);
      }
      setCopiedSelector(selector);
      setTimeout(() => setCopiedSelector(null), 3000);
      setIsInspectorMode(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, true);
    };
  }, [isInspectorMode]);

  // Speech synthesis helper
  const speakStep = useCallback(
    (text: string, voiceOverride?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      window.speechSynthesis.cancel();

      if (!text) return;

      speechTimerRef.current = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const targetVoiceName = voiceOverride || selectedVoiceName;
        if (targetVoiceName) {
          const voices = window.speechSynthesis.getVoices();
          const matchedVoice = voices.find((v) => v.name === targetVoiceName);
          if (matchedVoice) utterance.voice = matchedVoice;
        }

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }, 400);
    },
    [selectedVoiceName]
  );

  const stopAudio = useCallback(() => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, []);

  // Page Load Buffer Effect
  useEffect(() => {
    setIsPageLoaded(false);
    if (pageLoadTimerRef.current) clearTimeout(pageLoadTimerRef.current);

    const onFullyLoaded = () => {
      pageLoadTimerRef.current = setTimeout(() => {
        setIsPageLoaded(true);
      }, 450);
    };

    if (typeof document !== 'undefined' && document.readyState === 'complete') {
      onFullyLoaded();
    } else if (typeof window !== 'undefined') {
      window.addEventListener('load', onFullyLoaded, { once: true });
      onFullyLoaded();
    }

    return () => {
      if (pageLoadTimerRef.current) clearTimeout(pageLoadTimerRef.current);
    };
  }, [pathname, currentStepIndex]);

  const findTargetElement = (sel: string): { el: HTMLElement; rect: DOMRect } | null => {
    try {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return { el, rect };
      }
      const iframes = document.querySelectorAll('iframe');
      for (let i = 0; i < iframes.length; i++) {
        try {
          const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow?.document;
          if (iframeDoc) {
            const innerEl = iframeDoc.querySelector(sel) as HTMLElement | null;
            if (innerEl) {
              const iframeRect = iframes[i].getBoundingClientRect();
              const innerRect = innerEl.getBoundingClientRect();
              const computedRect = new DOMRect(
                iframeRect.left + innerRect.left,
                iframeRect.top + innerRect.top,
                innerRect.width,
                innerRect.height
              );
              if (computedRect.width > 0 && computedRect.height > 0) {
                return { el: innerEl, rect: computedRect };
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    return null;
  };

  // Locate target box & trigger audio ONLY after page is fully loaded
  useEffect(() => {
    if (!isOpen || !currentStep || !isPageLoaded) return;

    sessionStorage.setItem('tour_active', 'true');
    sessionStorage.setItem('tour_step_index', currentStepIndex.toString());

    let intervalId: NodeJS.Timeout;
    let attempts = 0;

    const updateNavPosition = () => {
      if (!currentStep?.route) {
        setNavRect(null);
        return;
      }
      const rawRoute = currentStep.route.split('?')[0];
      const cleanRoute = rawRoute === '/' ? '/' : rawRoute.replace(/\/$/, '');

      const candidateSelectors = [
        `a.nav-link[href="${currentStep.route}"]`,
        `a.nav-link[href="${cleanRoute}"]`,
        `a.nav-link[href="${cleanRoute}/"]`,
        `nav a[href="${currentStep.route}"]`,
        `nav a[href="${cleanRoute}"]`,
        `nav a[href="${cleanRoute}/"]`,
        `a.nav-link`,
        `a[href="${cleanRoute}"]`,
      ];

      for (const sel of candidateSelectors) {
        try {
          const els = document.querySelectorAll(sel);
          for (let i = 0; i < els.length; i++) {
            const navEl = els[i] as HTMLElement;
            const hrefAttr = navEl.getAttribute('href');
            if (hrefAttr && (hrefAttr === cleanRoute || hrefAttr === currentStep.route || (cleanRoute !== '/' && hrefAttr.includes(cleanRoute)))) {
              const rect = navEl.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                setNavRect(rect);
                return;
              }
            }
          }
        } catch (e) {}
      }
      setNavRect(null);
    };

    const locateTarget = (useFallback = false) => {
      updateNavPosition();
      const selectors = [
        currentStep.primarySelector,
        ...(useFallback ? (currentStep.fallbackSelectors || []) : []),
      ].filter(Boolean) as string[];

      for (const selectorGroup of selectors) {
        const subSelectors = selectorGroup.split(',').map((s) => s.trim());
        for (const sel of subSelectors) {
          const res = findTargetElement(sel);
          if (res) {
            const { el, rect: initialRect } = res;
            const inViewport = initialRect.top >= 0 && initialRect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
            if (!inViewport && el.scrollIntoView) {
              el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
            const updatePosition = () => {
              updateNavPosition();
              const currentRes = findTargetElement(sel);
              if (currentRes && currentRes.rect.width > 0 && currentRes.rect.height > 0) {
                setTargetRect(currentRes.rect);
              }
            };
            updatePosition();
            requestAnimationFrame(updatePosition);
            setTimeout(updatePosition, 100);
            setTimeout(updatePosition, 400);
            return true;
          }
        }
      }
      setTargetRect(null);
      return false;
    };

    let hasSpoken = false;
    const tryLocate = () => {
      attempts++;
      updateNavPosition();
      const found = locateTarget(attempts > 12);
      if (found && !hasSpoken) {
        hasSpoken = true;
        speakStep(currentStep.speechText);
      }
      if (found || attempts >= 25) {
        clearInterval(intervalId);
      }
    };

    tryLocate();
    intervalId = setInterval(tryLocate, 150);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    };
  }, [currentStepIndex, isOpen, pathname, currentStep, isPageLoaded, speakStep]);

  // Keep target box position aligned on scroll or window resize
  useEffect(() => {
    if (!isOpen || !currentStep || !isPageLoaded) return;

    const updateRect = () => {
      if (currentStep?.route) {
        const cleanRoute = currentStep.route.split('?')[0];
        const navEl = document.querySelector(
          `nav a[href="${currentStep.route}"], nav a[href="${cleanRoute}"], a.nav-link[href="${cleanRoute}"]`
        );
        if (navEl) {
          const r = navEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) setNavRect(r);
        }
      }

      const selectors = [
        currentStep.primarySelector,
        ...(currentStep.fallbackSelectors || []),
      ].filter(Boolean) as string[];

      for (const selectorGroup of selectors) {
        const subSelectors = selectorGroup.split(',').map((s) => s.trim());
        for (const sel of subSelectors) {
          const res = findTargetElement(sel);
          if (res && res.rect.width > 0 && res.rect.height > 0) {
            setTargetRect(res.rect);
            return;
          }
        }
      }
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, currentStep, isPageLoaded]);

  const navigateToStep = (targetStepIndex: number) => {
    stopAudio();
    const targetStep = DEFAULT_TOUR_STEPS[targetStepIndex];
    sessionStorage.setItem('tour_step_index', targetStepIndex.toString());
    sessionStorage.setItem('tour_active', 'true');

    setCurrentStepIndex(targetStepIndex);

    const targetCleanRoute = targetStep.route.split('?')[0];
    const currentCleanPath = pathname.split('?')[0];

    if (targetCleanRoute !== currentCleanPath) {
      setIsPageLoaded(false);
      router.push(targetStep.route);
    } else {
      setIsPageLoaded(true);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < DEFAULT_TOUR_STEPS.length - 1) {
      navigateToStep(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      navigateToStep(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    stopAudio();
    const currentCount = parseInt(localStorage.getItem('onboarding_tour_views_count') || '0', 10);
    localStorage.setItem('onboarding_tour_views_count', Math.max(currentCount, 2).toString());
    localStorage.setItem('has_seen_onboarding_tour', 'true');
    sessionStorage.removeItem('tour_active');
    sessionStorage.removeItem('tour_step_index');
    setIsOpen(false);
    onClose?.();
  };

  const isTrackerTour = currentStep?.id === 'study-tracker-tour';

  let arrowStartX = 0;
  let arrowStartY = 0;
  let arrowEndX = 0;
  let arrowEndY = 0;
  let arrowControlX = 0;
  let arrowControlY = 0;

  if (targetRect && popoverRect) {
    arrowEndX = targetRect.left + targetRect.width / 2;
    const targetIsAbove = targetRect.top < popoverRect.top;
    arrowEndY = targetIsAbove ? targetRect.bottom + 12 : targetRect.top - 12;

    arrowStartX = popoverRect.left + popoverRect.width / 2;
    arrowStartY = targetIsAbove ? popoverRect.top - 6 : popoverRect.bottom + 6;

    arrowControlX = (arrowStartX + arrowEndX) / 2 + (arrowStartX < arrowEndX ? 30 : -30);
    arrowControlY = (arrowStartY + arrowEndY) / 2;
  }

  return (
    <>
      {/* Toast Notification when element is selected */}
      {copiedSelector && (
        <div className="fixed top-20 right-6 z-[100005] px-4 py-2.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>Selected Target Selector: <code className="font-mono text-white">{copiedSelector}</code></span>
        </div>
      )}

      {/* Visual Element Inspector Hover Box */}
      {isInspectorMode && (
        <>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100005] pointer-events-auto bg-slate-900/90 border border-cyan-500/50 px-4 py-2 rounded-full shadow-2xl text-xs font-semibold text-cyan-300 flex items-center space-x-2 animate-pulse">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Click any box on the page to pick as highlight target</span>
            <button
              onClick={() => setIsInspectorMode(false)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {hoveredRect && (
            <div
              className="fixed z-[100004] border-2 border-dashed border-cyan-400 bg-cyan-500/10 pointer-events-none rounded-xl transition-all duration-75"
              style={{
                top: `${hoveredRect.top}px`,
                left: `${hoveredRect.left}px`,
                width: `${hoveredRect.width}px`,
                height: `${hoveredRect.height}px`,
              }}
            />
          )}
        </>
      )}

      {isOpen && currentStep && isPageLoaded && (
        <div className="fixed inset-0 z-[99999] pointer-events-none font-sans animate-fade-in">
            {/* Fallback Backdrop if targetRect is not present */}
            {!targetRect && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" />
            )}

            {/* Cutout Spotlight Overlay */}
            {targetRect && (
              <div
                className={`fixed z-[100000] rounded-2xl transition-all duration-200 pointer-events-none ${
                  isTrackerTour
                    ? 'border-4 border-amber-400 animate-pulse bg-amber-400/25 shadow-[0_0_60px_rgba(251,191,36,1),0_0_30px_rgba(56,189,248,0.9)] ring-4 ring-amber-400/60'
                    : 'border-2 border-cyan-400 shadow-[0_0_40px_rgba(56,189,248,0.8)]'
                }`}
                style={{
                  top: `${Math.max(10, targetRect.top - 6)}px`,
                  left: `${Math.max(10, targetRect.left - 6)}px`,
                  width: `${targetRect.width + 12}px`,
                  height: `${targetRect.height + 12}px`,
                  boxShadow: isTrackerTour
                    ? '0 0 0 9999px rgba(11, 15, 25, 0.88), 0 0 50px rgba(251, 191, 36, 1)'
                    : '0 0 0 9999px rgba(11, 15, 25, 0.85)',
                }}
              >
                {/* Floating Callout Pointer Badge for Tracker Tour */}
                {isTrackerTour && (
                  <div
                    className={`absolute -bottom-12 z-[100006] ${
                      typeof window !== 'undefined' && targetRect.left + targetRect.width / 2 > window.innerWidth / 2
                        ? 'right-0'
                        : 'left-0'
                    } px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-[0_0_30px_rgba(251,191,36,1)] flex items-center space-x-1.5 sm:space-x-2 animate-bounce whitespace-nowrap border border-slate-950 max-w-[calc(100vw-2rem)]`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping shrink-0" />
                    <span className="truncate">👉 CLICK "✨ TAKE A TOUR" HERE 👈</span>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic SVG Pointer Arrow from Tour Card Popover to Target Button */}
            {targetRect && popoverRect && (
              <svg className="fixed inset-0 z-[100002] w-full h-full pointer-events-none overflow-visible">
                <defs>
                  <linearGradient id="tourArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <marker
                    id="tourArrowHead"
                    markerWidth="12"
                    markerHeight="12"
                    refX="9"
                    refY="6"
                    orient="auto"
                  >
                    <path d="M 0 2 L 10 6 L 0 10 Z" fill="#fbbf24" />
                  </marker>
                </defs>
                <path
                  d={`M ${arrowStartX} ${arrowStartY} Q ${arrowControlX} ${arrowControlY} ${arrowEndX} ${arrowEndY}`}
                  fill="none"
                  stroke="url(#tourArrowGrad)"
                  strokeWidth={isTrackerTour ? '4' : '3'}
                  strokeDasharray={isTrackerTour ? '6 3' : '8 4'}
                  markerEnd="url(#tourArrowHead)"
                  className="animate-pulse drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                />
              </svg>
            )}

            {/* Secondary Pulsating Highlight Box for Active Navbar Link */}
            {navRect && (() => {
              const isSameRect =
                targetRect &&
                Math.abs(targetRect.top - navRect.top) < 10 &&
                Math.abs(targetRect.left - navRect.left) < 10;
              if (isSameRect) return null;
              return (
                <div
                  className="fixed z-[100005] border-2 border-cyan-400 rounded-xl transition-all duration-200 pointer-events-none animate-pulse shadow-[0_0_35px_rgba(56,189,248,0.9)] bg-cyan-400/20"
                  style={{
                    top: `${Math.max(2, navRect.top - 4)}px`,
                    left: `${Math.max(2, navRect.left - 4)}px`,
                    width: `${navRect.width + 8}px`,
                    height: `${navRect.height + 8}px`,
                  }}
                >
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-950 border border-cyan-400 text-[10px] font-extrabold text-cyan-300 whitespace-nowrap shadow-2xl flex items-center gap-1.5 z-[100006]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Active Page Nav Link</span>
                  </span>
                </div>
              );
            })()}

            {/* Tour Card Popover */}
            <div
              ref={popoverRef}
              className={`pointer-events-auto fixed z-[100001] max-w-[calc(100vw-2rem)] sm:max-w-md w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl text-slate-100 space-y-3 sm:space-y-4 transition-all duration-300 left-1/2 -translate-x-1/2 ${
                targetRect && targetRect.top < window.innerHeight / 2
                  ? 'bottom-4 sm:bottom-8'
                  : 'top-1/2 -translate-y-1/2'
              }`}
            >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <span className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-400 block truncate">
                    First-Time User Guide ({currentStepIndex + 1}/{DEFAULT_TOUR_STEPS.length})
                  </span>
                  <h3 className="font-bold text-xs sm:text-base text-slate-100 truncate">{currentStep.title}</h3>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={handleComplete}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                  title="Close Tour"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">{currentStep.description}</p>

            {/* Audio Bar */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-xs text-cyan-300 min-w-0 flex-1">
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[10px] sm:text-[11px] truncate italic">"{currentStep.speechText}"</span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {availableVoices.length > 1 && (
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      speakStep(currentStep.speechText, e.target.value);
                    }}
                    className="px-2 py-1 text-[10px] bg-slate-900 border border-cyan-500/30 rounded-lg text-cyan-300 focus:outline-none max-w-[110px] sm:max-w-[130px] truncate"
                    title="Select Speech Voice"
                  >
                    {availableVoices.map((v) => {
                      const nameLower = v.name.toLowerCase();
                      const langLower = v.lang.toLowerCase();
                      const isHindi =
                        langLower.includes('hi') ||
                        nameLower.includes('swara') ||
                        nameLower.includes('madhur') ||
                        nameLower.includes('hindi') ||
                        nameLower.includes('हिन्दी');

                      const tag = isHindi ? 'Hindi' : 'Eng India';
                      const cleanName =
                        v.name
                          .replace(/(Microsoft|Google|Apple)\s*/gi, '')
                          .replace(/Online\s*\(Natural\)\s*/gi, '')
                          .replace(/-\s*English\s*\(India\)/gi, '')
                          .replace(/-\s*Hindi\s*\(India\)/gi, '')
                          .replace(/हिन्दी/gi, 'Hindi')
                          .trim() || (isHindi ? 'Hindi Voice' : 'English Voice');

                      return (
                        <option key={v.name} value={v.name}>
                          {cleanName} ({tag})
                        </option>
                      );
                    })}
                  </select>
                )}

                <button
                  onClick={() => (isPlayingAudio ? stopAudio() : speakStep(currentStep.speechText))}
                  className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition shrink-0"
                  title={isPlayingAudio ? 'Stop Audio' : 'Play Audio'}
                >
                  {isPlayingAudio ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="pt-2.5 sm:pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={handleComplete}
                className="text-slate-400 hover:text-slate-200 text-[11px] sm:text-xs font-medium transition"
              >
                Skip Tour
              </button>

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] sm:text-xs flex items-center space-x-1 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {currentStepIndex < DEFAULT_TOUR_STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center space-x-1 shadow-lg shadow-cyan-500/20 transition"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center space-x-1 shadow-lg shadow-emerald-500/20 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Get Started</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
