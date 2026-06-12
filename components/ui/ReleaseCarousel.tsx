"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent, ReactElement, ReactNode } from "react";

type ReleaseCarouselProps = {
  labelledBy: string;
  children: ReactNode;
  initialIndex: number;
  releaseCount: number;
  initialTitle: string;
  releaseTitles: string[];
};

type CarouselChildProps = {
  activeIndex?: number;
  activePosition?: number;
  displayPosition?: number;
  releaseCount?: number;
  metrics?: CarouselMetrics;
  motionEnergy?: number;
  pointer?: CarouselPointer;
  onSelect?: (index: number) => void;
  suppressCardClick?: () => boolean;
};

export type CarouselMetrics = {
  activeWidth: number;
  sideWidth: number;
  sideOffset: number;
  farOffset: number;
  sideScale: number;
  farScale: number;
  rem: number;
  dragDistance: number;
};

export type CarouselPointer = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: number;
  lastPosition: number;
  lastTime: number;
  velocity: number;
  intent: "pending" | "horizontal" | "vertical";
};

type MotionDirection = -1 | 0 | 1;

const dragIntentThreshold = 7;
const maxReleaseVelocity = 0.042;
const springStrength = 0.00015;
const springDamping = 0.0215;
const snapVelocity = 0.00065;
const momentumProjectionMs = 280;
const maxMomentumCards = 8;
const autoplayDelay = 4800;
const autoplayIdleDelay = 3600;
const autoplayReleaseVelocity = 0.0036;
const nativeScrollMediaQuery = "(max-width: 768px)";

const defaultMetrics: CarouselMetrics = {
  activeWidth: 520,
  sideWidth: 420,
  sideOffset: 420,
  farOffset: 760,
  sideScale: 0.64,
  farScale: 0.48,
  rem: 16,
  dragDistance: 300,
};

const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const wrappedOffset = (index: number, position: number, count: number) => {
  if (count <= 0) {
    return 0;
  }

  const half = count / 2;
  return ((((index - position + half) % count) + count) % count) - half;
};

const shapeHandoffPosition = (position: number, direction: MotionDirection) => {
  const base = Math.floor(position);
  const fraction = position - base;
  const midpointBias = direction * Math.sin(fraction * Math.PI) * 0.105;
  const shapedFraction = clamp(
    fraction - Math.sin(fraction * Math.PI * 2) * 0.085 + midpointBias,
    0,
    1,
  );

  return base + shapedFraction;
};

export function ReleaseCarousel({
  labelledBy,
  children,
  initialIndex,
  releaseCount,
  initialTitle,
  releaseTitles,
}: ReleaseCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activePositionRef = useRef(initialIndex);
  const animationFrame = useRef<number | null>(null);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<DragState | null>(null);
  const prefersReducedMotion = useRef(false);
  const suppressNextSelect = useRef(false);
  const suppressSelectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseCountRef = useRef(Math.max(releaseCount, 1));
  const metricsRef = useRef(defaultMetrics);
  const [activePosition, setActivePosition] = useState(initialIndex);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [isGliding, setIsGliding] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isUserActive, setIsUserActive] = useState(false);
  const [usesNativeScroll, setUsesNativeScroll] = useState(false);
  const [motionDirection, setMotionDirection] = useState<MotionDirection>(0);
  const [metrics, setMetrics] = useState<CarouselMetrics>(defaultMetrics);
  const [motionEnergy, setMotionEnergy] = useState(0);
  const [pointer, setPointer] = useState<CarouselPointer>({ x: 0.5, y: 0.42 });

  const commitPosition = useCallback((position: number, velocity = 0, syncActive = false) => {
    const count = releaseCountRef.current;

    activePositionRef.current = position;
    setActivePosition(position);

    if (syncActive) {
      setActiveIndex(wrapIndex(Math.round(position), count));
    }

    setMotionEnergy(clamp(Math.abs(velocity) * 42, 0, 1));
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    setIsGliding(false);
  }, []);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const markUserActive = useCallback(() => {
    setIsUserActive(true);
    clearAutoplayTimer();

    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    idleTimer.current = setTimeout(() => {
      setIsUserActive(false);
      idleTimer.current = null;
    }, autoplayIdleDelay);
  }, [clearAutoplayTimer]);

  const animateToPosition = useCallback(
    (targetPosition: number, releaseVelocity = 0) => {
      stopAnimation();
      setIsGliding(true);
      setMotionDirection(
        targetPosition === activePositionRef.current
          ? 0
          : targetPosition > activePositionRef.current
            ? 1
            : -1,
      );

      let lastTime = performance.now();
      let velocity = clamp(releaseVelocity, -maxReleaseVelocity, maxReleaseVelocity);

      const tick = (now: number) => {
        const deltaTime = clamp(now - lastTime, 1, 32);
        lastTime = now;

        const currentPosition = activePositionRef.current;
        const distance = targetPosition - currentPosition;

        velocity += distance * springStrength * deltaTime;
        velocity *= Math.exp(-springDamping * deltaTime);

        const nextPosition = currentPosition + velocity * deltaTime;
        commitPosition(nextPosition, velocity);

        if (Math.abs(distance) < 0.0022 && Math.abs(velocity) < 0.000215) {
          commitPosition(targetPosition, 0, true);
          setMotionDirection(0);
          setIsGliding(false);
          animationFrame.current = null;
          return;
        }

        animationFrame.current = requestAnimationFrame(tick);
      };

      animationFrame.current = requestAnimationFrame(tick);
    },
    [commitPosition, stopAnimation],
  );

  const startMomentum = useCallback(
    (releaseVelocity: number) => {
      const currentPosition = activePositionRef.current;
      const projectedTravel =
        Math.abs(releaseVelocity) < snapVelocity
          ? 0
          : clamp(
              releaseVelocity * momentumProjectionMs,
              -maxMomentumCards,
              maxMomentumCards,
            );
      const snapTarget = Math.round(currentPosition + projectedTravel);

      animateToPosition(snapTarget, releaseVelocity * 0.68);
    },
    [animateToPosition],
  );

  const updateNativeActiveCard = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-card]"));

    if (!cards.length) {
      return;
    }

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(trackCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    commitPosition(closestIndex, 0, true);
    setMotionDirection(0);
    setMotionEnergy(0);
  }, [commitPosition]);

  const scrollToNativeCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;

      if (!track) {
        return;
      }

      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-carousel-card]"));
      const nextIndex = clamp(index, 0, cards.length - 1);

      cards[nextIndex]?.scrollIntoView({
        behavior,
        block: "nearest",
        inline: "center",
      });

      commitPosition(nextIndex, 0, true);
    },
    [commitPosition],
  );

  const move = useCallback(
    (direction: "previous" | "next") => {
      if (usesNativeScroll) {
        scrollToNativeCard(activeIndex + (direction === "next" ? 1 : -1));
        return;
      }

      const targetPosition =
        Math.round(activePositionRef.current) + (direction === "next" ? 1 : -1);

      animateToPosition(targetPosition);
    },
    [activeIndex, animateToPosition, scrollToNativeCard, usesNativeScroll],
  );

  const selectIndex = useCallback(
    (index: number) => {
      if (suppressNextSelect.current) {
        suppressNextSelect.current = false;
        return;
      }

      if (usesNativeScroll) {
        scrollToNativeCard(index);
        return;
      }

      const targetPosition =
        activePositionRef.current +
        wrappedOffset(index, activePositionRef.current, releaseCountRef.current);

      animateToPosition(targetPosition);
    },
    [animateToPosition, scrollToNativeCard, usesNativeScroll],
  );

  const suppressCardClick = useCallback(() => {
    if (!suppressNextSelect.current) {
      return false;
    }

    suppressNextSelect.current = false;
    return true;
  }, []);

  const suppressSelectionBriefly = () => {
    suppressNextSelect.current = true;

    if (suppressSelectTimeout.current) {
      clearTimeout(suppressSelectTimeout.current);
    }

    suppressSelectTimeout.current = setTimeout(() => {
      suppressNextSelect.current = false;
    }, 250);
  };

  const updatePointer = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const bounds = track.getBoundingClientRect();

    setPointer({
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    markUserActive();

    if (target.closest("a, button")) {
      return;
    }

    stopAnimation();
    setMotionDirection(0);
    updatePointer(event);

    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: activePositionRef.current,
      lastPosition: activePositionRef.current,
      lastTime: performance.now(),
      velocity: 0,
      intent: "pending",
    };
    trackRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    updatePointer(event);

    const drag = dragState.current;

    if (!drag) {
      setMotionDirection(0);
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.intent === "pending") {
      if (
        Math.abs(deltaY) > dragIntentThreshold &&
        Math.abs(deltaY) > Math.abs(deltaX) * 1.15
      ) {
        drag.intent = "vertical";
        return;
      }

      if (
        Math.abs(deltaX) < dragIntentThreshold ||
        Math.abs(deltaX) <= Math.abs(deltaY)
      ) {
        return;
      }

      drag.intent = "horizontal";
      setIsDragging(true);
    }

    if (drag.intent !== "horizontal") {
      return;
    }

    event.preventDefault();

    const nextPosition =
      drag.startPosition - deltaX / Math.max(metricsRef.current.dragDistance, 1);
    const now = performance.now();
    const deltaTime = Math.max(now - drag.lastTime, 1);
    const instantVelocity = (nextPosition - drag.lastPosition) / deltaTime;
    const dragDirection = Math.sign(nextPosition - drag.lastPosition) as MotionDirection;

    drag.velocity = drag.velocity * 0.58 + instantVelocity * 0.42;
    drag.lastPosition = nextPosition;
    drag.lastTime = now;

    if (dragDirection !== 0) {
      setMotionDirection(dragDirection);
    }

    commitPosition(nextPosition, drag.velocity);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    dragState.current = null;

    if (trackRef.current?.hasPointerCapture(event.pointerId)) {
      trackRef.current.releasePointerCapture(event.pointerId);
    }

    if (!drag) {
      return;
    }

    if (drag.intent === "horizontal") {
      event.preventDefault();
      suppressSelectionBriefly();
      setIsDragging(false);
      startMomentum(drag.velocity);
      return;
    }

    setIsDragging(false);
    setMotionDirection(0);
  };

  useEffect(() => {
    releaseCountRef.current = Math.max(releaseCount, 1);
  }, [releaseCount]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(nativeScrollMediaQuery);
    const updateNativeScrollMode = () => {
      setUsesNativeScroll(mediaQuery.matches);
    };

    updateNativeScrollMode();
    mediaQuery.addEventListener("change", updateNativeScrollMode);

    return () => {
      mediaQuery.removeEventListener("change", updateNativeScrollMode);
    };
  }, []);

  useEffect(() => {
    if (!usesNativeScroll) {
      return;
    }

    stopAnimation();
    setIsDragging(false);
    requestAnimationFrame(() => {
      scrollToNativeCard(wrapIndex(Math.round(activePositionRef.current), releaseCountRef.current), "auto");
      updateNativeActiveCard();
    });
  }, [scrollToNativeCard, stopAnimation, updateNativeActiveCard, usesNativeScroll]);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return undefined;
    }

    const readLength = (propertyName: string, fallback: number) => {
      const probe = document.createElement("div");

      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.width = `var(${propertyName})`;
      probe.style.height = "0";

      track.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();

      return Number.isFinite(width) && width > 0 ? width : fallback;
    };

    const measureCarousel = () => {
      const computed = getComputedStyle(track);
      const rootComputed = getComputedStyle(document.documentElement);
      const rem = parseFloat(rootComputed.fontSize) || defaultMetrics.rem;
      const activeWidth = readLength(
        "--music-carousel-active-card-width",
        defaultMetrics.activeWidth,
      );
      const sideWidth = readLength("--music-carousel-side-card-width", defaultMetrics.sideWidth);
      const sideOffset = readLength("--music-carousel-side-offset", defaultMetrics.sideOffset);
      const farOffset = readLength("--music-carousel-far-offset", defaultMetrics.farOffset);
      const sideScale =
        parseFloat(computed.getPropertyValue("--music-carousel-side-scale")) ||
        defaultMetrics.sideScale;
      const farScale =
        parseFloat(computed.getPropertyValue("--music-carousel-far-scale")) ||
        defaultMetrics.farScale;
      const dragDistance = clamp(track.clientWidth * 0.28, 130, 340);
      const nextMetrics = {
        activeWidth,
        sideWidth,
        sideOffset,
        farOffset,
        sideScale,
        farScale,
        rem,
        dragDistance,
      };

      metricsRef.current = nextMetrics;
      setMetrics(nextMetrics);
    };

    measureCarousel();

    const resizeObserver = new ResizeObserver(measureCarousel);
    resizeObserver.observe(track);
    window.addEventListener("resize", measureCarousel);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureCarousel);
    };
  }, []);

  useEffect(() => {
    commitPosition(initialIndex, 0, true);
  }, [commitPosition, initialIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      prefersReducedMotion.current = mediaQuery.matches;
    };

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    clearAutoplayTimer();

    if (
      prefersReducedMotion.current ||
      usesNativeScroll ||
      isDragging ||
      isGliding ||
      isPointerInside ||
      isFocusWithin ||
      isUserActive ||
      releaseCount <= 1
    ) {
      return undefined;
    }

    autoplayTimer.current = setTimeout(() => {
      if (document.visibilityState !== "visible" || prefersReducedMotion.current) {
        return;
      }

      animateToPosition(Math.round(activePositionRef.current) + 1, autoplayReleaseVelocity);
    }, autoplayDelay);

    return clearAutoplayTimer;
  }, [
    activeIndex,
    animateToPosition,
    clearAutoplayTimer,
    isDragging,
    isFocusWithin,
    isGliding,
    isPointerInside,
    isUserActive,
    releaseCount,
    usesNativeScroll,
  ]);

  useEffect(
    () => () => {
      stopAnimation();
      clearAutoplayTimer();

      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }

      if (suppressSelectTimeout.current) {
        clearTimeout(suppressSelectTimeout.current);
      }
    },
    [clearAutoplayTimer, stopAnimation],
  );

  const activeTitle = releaseTitles[activeIndex] ?? initialTitle;
  const isInteracting = isDragging || isGliding;
  const isPaused = isPointerInside || isFocusWithin || isUserActive;
  const displayPosition = shapeHandoffPosition(activePosition, motionDirection);
  const activeCountLabel = String(wrapIndex(activeIndex, releaseCountRef.current) + 1).padStart(2, "0");
  const totalCountLabel = String(releaseCountRef.current).padStart(2, "0");

  return (
    <div className="music-release-carousel-shell">
      <p className="sr-only" aria-live="polite">
        {activeTitle}
      </p>
      <div
        ref={trackRef}
        role="region"
        aria-labelledby={labelledBy}
        tabIndex={0}
        data-dragging={isDragging ? "true" : "false"}
        data-motion={isInteracting ? "live" : "settled"}
        data-native-scroll={usesNativeScroll ? "true" : "false"}
        data-user-active={isPaused ? "true" : "false"}
        className="music-release-carousel-stage focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]"
        onKeyDown={(event) => {
          markUserActive();

          if (event.key === "ArrowRight") {
            event.preventDefault();
            move("next");
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move("previous");
          }
        }}
        onScroll={usesNativeScroll ? updateNativeActiveCard : undefined}
        onPointerDown={usesNativeScroll ? undefined : handlePointerDown}
        onPointerMove={usesNativeScroll ? undefined : handlePointerMove}
        onPointerUp={usesNativeScroll ? undefined : handlePointerEnd}
        onPointerCancel={usesNativeScroll ? undefined : handlePointerEnd}
        onPointerEnter={
          usesNativeScroll
            ? undefined
            : () => {
                setIsPointerInside(true);
                markUserActive();
              }
        }
        onPointerLeave={
          usesNativeScroll
            ? undefined
            : () => {
                setIsPointerInside(false);
                if (!dragState.current) {
                  setPointer({ x: 0.5, y: 0.42 });
                }
              }
        }
        onFocusCapture={() => {
          setIsFocusWithin(true);
          markUserActive();
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsFocusWithin(false);
            markUserActive();
          }
        }}
      >
        <div className="music-carousel-index-cue" aria-hidden="true">
          <span>{activeCountLabel}</span>
          <span>/</span>
          <span>{totalCountLabel}</span>
        </div>
        <div className="music-carousel-spin-cue" aria-hidden="true">
          <span className="music-carousel-spin-cue-chevron music-carousel-spin-cue-chevron-left" />
          <span className="music-carousel-spin-cue-track">
            <span className="music-carousel-spin-cue-grip" />
          </span>
          <span className="music-carousel-spin-cue-chevron music-carousel-spin-cue-chevron-right" />
        </div>
        {Children.map(children, (child) => {
          if (!isValidElement<CarouselChildProps>(child)) {
            return child;
          }

          return cloneElement(child as ReactElement<CarouselChildProps>, {
            activeIndex,
            activePosition,
            displayPosition,
            releaseCount,
            metrics,
            motionEnergy,
            pointer,
            onSelect: selectIndex,
            suppressCardClick,
          });
        })}
      </div>
      <div className="music-carousel-mobile-controls" aria-hidden="true">
        <div className="music-carousel-mobile-status" aria-hidden="true">
          <div className="music-carousel-spin-cue music-carousel-spin-cue-mobile">
            <span className="music-carousel-spin-cue-track">
              <span className="music-carousel-spin-cue-grip" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
