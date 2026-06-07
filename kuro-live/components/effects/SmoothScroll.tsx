'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.1,
    });

    const updateScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', updateScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', updateScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
        gsap.fromTo(
          element,
          { y: 44, opacity: 0, filter: 'blur(12px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(element => {
        const amount = Number(element.dataset.parallax || 8);
        gsap.fromTo(
          element,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: {
              trigger: element.parentElement || element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-scroll-shift]').forEach(element => {
        gsap.to(element, {
          xPercent: Number(element.dataset.scrollShift || -8),
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      gsap.to('.scroll-progress__bar', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          start: 0,
          end: 'max',
          scrub: 0.2,
        },
      });
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, [pathname]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduceMotion || !finePointer) return;

    const onPointerMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic], .neo-button');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      gsap.to(target, {
        x: (event.clientX - rect.left - rect.width / 2) * 0.16,
        y: (event.clientY - rect.top - rect.height / 2) * 0.16,
        duration: 0.35,
        ease: 'power3.out',
      });
    };

    const onPointerOut = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic], .neo-button');
      if (!target || target.contains(event.relatedTarget as Node)) return;
      gsap.to(target, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, .45)' });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('button, a');
      if (target) gsap.to(target, { scale: 0.96, duration: 0.12, ease: 'power2.out' });
    };

    const onPointerUp = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('button, a');
      if (target) gsap.to(target, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span className="scroll-progress__bar" />
    </div>
  );
}
