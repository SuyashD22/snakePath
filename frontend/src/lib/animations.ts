'use client';

import { useCallback } from 'react';
import gsap from 'gsap';
import { numberToPercentPosition, SnakeLadder } from '@/lib/gameUtils';

// Get the pixel position of a board number relative to the board container
function getBoardPixelPosition(num: number, boardEl: HTMLElement): { x: number; y: number } {
  const pos = numberToPercentPosition(num);
  const rect = boardEl.getBoundingClientRect();
  return {
    x: (pos.x / 100) * rect.width,
    y: (pos.y / 100) * rect.height,
  };
}

export function useSnakeAnimation() {
  const animateSnakeSwallow = useCallback(async (
    pawnEl: HTMLElement,
    snake: SnakeLadder,
    boardEl: HTMLElement,
    onComplete: () => void
  ) => {
    const headPos = getBoardPixelPosition(snake.start, boardEl);
    const tailPos = getBoardPixelPosition(snake.end, boardEl);
    const midX = (headPos.x + tailPos.x) / 2;
    const midY = (headPos.y + tailPos.y) / 2;

    const tl = gsap.timeline({ onComplete });

    // Phase 1: Pawn pulled toward snake head
    tl.to(pawnEl, {
      x: headPos.x - pawnEl.offsetLeft - pawnEl.offsetWidth / 2,
      y: headPos.y - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
      scale: 0.7,
      duration: 0.4,
      ease: 'power2.in',
    });

    // Phase 2: Ripple effect + shrink
    tl.to(pawnEl, {
      scale: 0.5,
      opacity: 0.6,
      rotation: 10,
      duration: 0.3,
      ease: 'power2.in',
    });

    // Phase 3: Travel through snake body with wobble
    tl.to(pawnEl, {
      x: midX - pawnEl.offsetLeft - pawnEl.offsetWidth / 2,
      y: midY - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
      rotation: -10,
      duration: 0.5,
      ease: 'none',
    });

    tl.to(pawnEl, {
      x: tailPos.x - pawnEl.offsetLeft - pawnEl.offsetWidth / 2,
      y: tailPos.y - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
      rotation: 10,
      duration: 0.5,
      ease: 'none',
    });

    // Phase 4: Exit at tail with bounce
    tl.to(pawnEl, {
      scale: 1.15,
      opacity: 1,
      rotation: 0,
      duration: 0.2,
      ease: 'back.out(2)',
    });

    tl.to(pawnEl, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  }, []);

  return { animateSnakeSwallow };
}

export function useLadderAnimation() {
  const animateLadderClimb = useCallback(async (
    pawnEl: HTMLElement,
    ladder: SnakeLadder,
    boardEl: HTMLElement,
    onComplete: () => void
  ) => {
    const bottomPos = getBoardPixelPosition(ladder.start, boardEl);
    const topPos = getBoardPixelPosition(ladder.end, boardEl);
    const numRungs = Math.max(3, Math.abs(ladder.end - ladder.start) / 10);

    const tl = gsap.timeline({ onComplete });

    // Move to ladder base
    tl.to(pawnEl, {
      x: bottomPos.x - pawnEl.offsetLeft - pawnEl.offsetWidth / 2,
      y: bottomPos.y - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Climb rung by rung
    for (let i = 1; i <= numRungs; i++) {
      const t = i / numRungs;
      const rungX = bottomPos.x + (topPos.x - bottomPos.x) * t;
      const rungY = bottomPos.y + (topPos.y - bottomPos.y) * t;
      tl.to(pawnEl, {
        x: rungX - pawnEl.offsetLeft - pawnEl.offsetWidth / 2,
        y: rungY - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
        duration: 0.15,
        ease: 'steps(1)',
      });
      // Small bounce at each rung
      tl.to(pawnEl, {
        y: (rungY - pawnEl.offsetTop - pawnEl.offsetHeight / 2) - 3,
        duration: 0.05,
        ease: 'power2.out',
      });
      tl.to(pawnEl, {
        y: rungY - pawnEl.offsetTop - pawnEl.offsetHeight / 2,
        duration: 0.05,
        ease: 'power2.in',
      });
    }

    // Bounce at top
    tl.to(pawnEl, {
      scale: 1.15,
      duration: 0.15,
      ease: 'back.out(3)',
    });

    tl.to(pawnEl, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  }, []);

  return { animateLadderClimb };
}
