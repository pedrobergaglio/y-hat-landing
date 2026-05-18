"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import data from "@/data/hackathon.json";

/* ---------- constants ---------- */

const SECTION_IDS = [
  "top",
  "hackathon",
  "tracks",
  "aprendizaje",
  "premios",
  "sponsors",
  "faq",
  "cta",
];

const SECTION_LABELS: Record<string, string> = {
  top: "Inicio",
  hackathon: "Programa",
  tracks: "Tracks",
  aprendizaje: "Aprendizaje",
  premios: "Premios",
  sponsors: "Sponsors",
  faq: "FAQ",
  cta: "Inscripción",
};

const DURATION = 680;
const LOCK_HOLD = 720;
const WHEEL_THRESHOLD = 12;
const WHEEL_COOLDOWN = 110;
const BOUNDARY_HOLD = 700;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function smoothScrollTo(targetY: number, duration: number) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;
  const startT = performance.now();
  function step(now: number) {
    const elapsed = now - startT;
    const t = Math.min(1, elapsed / duration);
    const y = startY + distance * easeInOutCubic(t);
    window.scrollTo(0, y);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- icons ---------- */

function TrackIcon({ kind }: { kind: string }) {
  if (kind === "atom") {
    return (
      <svg viewBox="0 0 24 24">
        <circle className="dot" cx="12" cy="12" r="1.4" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-60 12 12)" />
      </svg>
    );
  }
  if (kind === "network") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="5" cy="5" r="1.8" />
        <circle cx="19" cy="5" r="1.8" />
        <circle cx="5" cy="19" r="1.8" />
        <circle cx="19" cy="19" r="1.8" />
        <circle className="dot" cx="12" cy="12" r="2" />
        <path d="M6.5 6.5 L10.5 10.5 M17.5 6.5 L13.5 10.5 M6.5 17.5 L10.5 13.5 M17.5 17.5 L13.5 13.5" />
      </svg>
    );
  }
  if (kind === "trend") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 17 L9 11 L13 14 L21 6" />
        <path d="M16 6 L21 6 L21 11" />
        <circle className="dot" cx="9" cy="11" r="1.4" />
        <circle className="dot" cx="13" cy="14" r="1.4" />
      </svg>
    );
  }
  return null;
}

/* ---------- types ---------- */

type TitlePart = { text: string; em?: boolean };
type Track = {
  key: string;
  titleParts: TitlePart[];
  desc: string;
  areas: string[];
  icon: string;
};
type Fact = {
  label: string;
  value?: string;
  valueEm?: string;
  hint: string;
};
type Sponsor = {
  name: string;
  logo: string;
  h?: number;
  invert?: boolean;
  tight?: boolean;
};
type SponsorTier = {
  tier: string;
  label: string;
  items: Sponsor[];
};

/* ---------- page ---------- */

export default function HackathonPage() {
  const { meta, prize, phases, learn, faq } = data;
  const facts = data.facts as Fact[];
  const tracks = data.tracks as Track[];
  const sponsors = data.sponsors as SponsorTier[];

  const [activeIdx, setActiveIdx] = useState(0);
  const currentIndexRef = useRef(0);
  const lockedRef = useRef(false);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const stickyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number) => {
    const sections = sectionsRef.current;
    if (!sections.length) return;
    const next = Math.max(0, Math.min(sections.length - 1, index));
    if (next === currentIndexRef.current || lockedRef.current) return;
    lockedRef.current = true;
    currentIndexRef.current = next;
    const targetY =
      sections[next].getBoundingClientRect().top + window.scrollY;
    smoothScrollTo(targetY, DURATION);
    setActiveIdx(next);
    setTimeout(() => {
      lockedRef.current = false;
    }, LOCK_HOLD);
  }, []);

  /* IntersectionObserver-driven scroll animations */
  useEffect(() => {
    document.documentElement.classList.add("anims-ready");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const root = rootRef.current;
    if (!root) return;
    const anims = root.querySelectorAll<HTMLElement>(
      "[data-anim], [data-stagger]"
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      anims.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    anims.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Sticky CTA visibility */
  useEffect(() => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (
        y > 700 &&
        y < document.body.scrollHeight - window.innerHeight - 500
      ) {
        sticky.classList.add("show");
      } else {
        sticky.classList.remove("show");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sponsor auto-fit */
  useEffect(() => {
    function fitRow(row: HTMLElement, minH: number, maxH: number) {
      const cards = Array.from(
        row.querySelectorAll<HTMLElement>(".sponsor-card")
      );
      if (!cards.length) return;
      const imgs = cards
        .map((c) => c.querySelector("img") as HTMLImageElement | null)
        .filter(Boolean) as HTMLImageElement[];
      if (!imgs.length) return;
      if (!imgs.every((img) => img.naturalWidth > 0 && img.naturalHeight > 0))
        return;
      const aspects = imgs.map((img) => img.naturalWidth / img.naturalHeight);
      const totalAspect = aspects.reduce((a, b) => a + b, 0);
      const rowStyle = window.getComputedStyle(row);
      const gap = parseFloat(rowStyle.gap) || 0;
      const padX = cards.map((c) => {
        const s = window.getComputedStyle(c);
        return parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
      });
      const totalPadding = padX.reduce((a, b) => a + b, 0);
      const gapsTotal = gap * (cards.length - 1);
      const available = row.clientWidth;
      const fitH = Math.floor(
        (available - totalPadding - gapsTotal) / totalAspect
      );
      const finalH = Math.max(minH, Math.min(maxH, fitH));
      imgs.forEach((img) => {
        img.style.setProperty("height", finalH + "px", "important");
      });
    }

    function fitAll() {
      if (window.innerWidth < 1024) return;
      const section = document.querySelector("section.sec#sponsors");
      if (!section) return;
      const tiers = section.querySelectorAll<HTMLElement>(
        ".sponsors-tier .sponsors-row"
      );
      if (tiers[0]) fitRow(tiers[0], 56, 110);
      if (tiers[1]) fitRow(tiers[1], 36, 72);
      if (tiers[2]) fitRow(tiers[2], 30, 60);
    }

    function whenImagesReady(cb: () => void) {
      const imgs = document.querySelectorAll<HTMLImageElement>(
        "section.sec#sponsors img"
      );
      let pending = 0;
      imgs.forEach((img) => {
        if (!img.complete || !img.naturalWidth) {
          pending++;
          img.addEventListener(
            "load",
            () => {
              if (--pending === 0) cb();
            },
            { once: true }
          );
          img.addEventListener(
            "error",
            () => {
              if (--pending === 0) cb();
            },
            { once: true }
          );
        }
      });
      if (pending === 0) cb();
    }

    whenImagesReady(fitAll);
    let resizeT: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeT) clearTimeout(resizeT);
      resizeT = setTimeout(fitAll, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeT) clearTimeout(resizeT);
    };
  }, []);

  /* Wheel-hijack snap navigation (desktop, no reduced motion) */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = () =>
      window.innerWidth >= 1024 &&
      window.matchMedia("(hover: hover)").matches;

    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(".hero, section.sec, .closing")
    );
    sectionsRef.current = sections;

    if (reduce || !isDesktop()) return;
    if (sections.length < 2) return;

    window.scrollTo(0, 0);

    let lastInnerScrollTime = 0;

    function consumeInnerScroll(
      deltaY: number
    ): "consumed" | "boundary" | "none" {
      const section = sections[currentIndexRef.current];
      if (!section) return "none";
      const inner = section.querySelector<HTMLElement>(
        "[data-inner-scroll], .faq"
      );
      if (!inner) return "none";
      if (inner.scrollHeight <= inner.clientHeight + 1) return "none";
      const atTop = inner.scrollTop <= 0;
      const atBottom =
        inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1;
      if ((deltaY > 0 && atBottom) || (deltaY < 0 && atTop)) {
        return "boundary";
      }
      inner.scrollTop += deltaY;
      lastInnerScrollTime = performance.now();
      return "consumed";
    }

    function isPastLastSnap() {
      if (!sections.length) return false;
      const last = sections[sections.length - 1];
      return window.scrollY > last.offsetTop + 40;
    }
    function isAtLastSnap() {
      if (!sections.length) return false;
      const last = sections[sections.length - 1];
      return Math.abs(window.scrollY - last.offsetTop) < 40;
    }

    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (!isDesktop()) return;
      if (isPastLastSnap()) return;
      if (isAtLastSnap() && e.deltaY > 0) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      const innerResult = consumeInnerScroll(e.deltaY);
      if (innerResult === "consumed") return;
      if (innerResult === "boundary") {
        const sinceInner = performance.now() - lastInnerScrollTime;
        if (sinceInner < BOUNDARY_HOLD) return;
      }
      if (lockedRef.current) return;
      const now = performance.now();
      if (now - lastWheelTime < WHEEL_COOLDOWN) return;
      lastWheelTime = now;
      goTo(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1));
    };

    const onKey = (e: KeyboardEvent) => {
      if (!isDesktop()) return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const target = e.target as HTMLElement | null;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (target && target.isContentEditable)
      )
        return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(currentIndexRef.current + 1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(currentIndexRef.current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(sections.length - 1);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (!isDesktop()) return;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDesktop()) return;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!isDesktop()) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 30) return;
      goTo(currentIndexRef.current + (diff > 0 ? 1 : -1));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    /* Anchor hijack — intercept #-links in desktop snap mode */
    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    );
    const handlers: Array<{ el: HTMLAnchorElement; fn: (e: MouseEvent) => void }> = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      const idx = sections.indexOf(target as HTMLElement);
      if (idx === -1) return;
      const fn = (e: MouseEvent) => {
        if (!isDesktop()) return;
        e.preventDefault();
        goTo(idx);
      };
      a.addEventListener("click", fn);
      handlers.push({ el: a, fn });
    });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      handlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
    };
  }, [goTo]);

  const tickerItems = [
    "Hackathón de Negocios",
    "5 · 6 · 7 / Junio · 2026",
    "0+Infinito · Exactas, UBA",
    "Equipos de 3 o 4",
    "USD 4.500 + 90K AWS",
    "Tres tracks · Tres jurados",
    "Inscripciones abiertas",
  ];

  return (
    <div ref={rootRef}>
      {/* TICKER */}
      <div className="ticker" aria-hidden="true">
        <div className="track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* NAV (mobile only in snap mode) */}
      <nav className="top">
        <a href="#top" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
          <span>Hackathón de Negocios</span>
        </a>
        <span className="links">
          <a href="#hackathon">El hackathón</a>
          <a href="#tracks">Tracks</a>
          <a href="#aprendizaje">Aprendizaje</a>
          <a href="#cronograma">Cronograma</a>
          <a href="#sponsors">Sponsors</a>
          <a href="#faq">FAQ</a>
        </span>
        <a
          href={meta.ctas.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="cta"
        >
          Inscribirme <span className="ar">→</span>
        </a>
      </nav>

      <div className="wrap">
        {/* HERO */}
        <section className="hero" id="top">
          <div className="grid">
            <div data-stagger>
              <h1>
                Hackathón
                <br />
                <em>de Negocios</em>
              </h1>

              <p className="tagline">
                <b>La intersección</b> de la tecnología, la innovación y los
                negocios.
              </p>

              <p className="lede">
                Tres días para transformar descubrimientos científicos e ideas
                innovadoras en{" "}
                <strong>propuestas de valor concretas y viables</strong>.
                Mentorías y talleres a lo largo del fin de semana, y un pitch
                final ante el jurado de cada track.
              </p>

              <div className="actions">
                <a
                  href={meta.ctas.primary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Inscribirme <span className="ar">→</span>
                </a>
                <a
                  href={meta.ctas.secondary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  title={meta.ctas.secondary.note}
                >
                  ¿No tenés equipo? Formalo acá ↗
                </a>
              </div>
            </div>

            <div className="ymark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hackathon/logo-yhat.svg" alt="" />
            </div>
          </div>

          <div className="facts" data-stagger>
            {facts.map((f) => (
              <div className="f" key={f.label}>
                <div className="lbl">{f.label}</div>
                <div className="v">
                  {f.value ? <>{f.value} </> : null}
                  {f.valueEm ? <em>{f.valueEm}</em> : null}
                </div>
                <div className="hint">{f.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 01 — CÓMO FUNCIONA */}
        <section className="sec" id="hackathon">
          <div className="sec-head" data-anim="rise">
            <div className="num">01 · Cómo funciona</div>
            <h2>
              Cuatro fases <em>en tres días</em>.
            </h2>
            <p>Las cuatro etapas que recorre cada equipo durante el evento.</p>
          </div>

          <div className="steps" data-stagger>
            {phases.map((p) => (
              <div className="step" key={p.num}>
                <div className="num">{p.num}</div>
                <h3>
                  <em>{p.title}</em>
                </h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 02 — LAS ÁREAS */}
        <section className="sec" id="tracks">
          <div className="sec-head" data-anim="rise">
            <div className="num">02 · Las áreas</div>
            <h2>
              Tres <em>tracks</em>, tres jurados.
            </h2>
            <p>
              Cada track tiene su propio jurado, mentores y criterio de
              evaluación. Vas a poder elegir el tuyo al inscribirte.
            </p>
          </div>

          <div className="tracks" data-stagger>
            {tracks.map((t) => (
              <article className="track" key={t.key}>
                <div className="row">
                  <h3>
                    {t.titleParts.map((part, i) =>
                      part.em ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>
                    )}
                  </h3>
                  <span className="ix" aria-hidden="true">
                    <TrackIcon kind={t.icon} />
                  </span>
                </div>
                <p className="desc">{t.desc}</p>
                <div className="areas">
                  {t.areas.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 03 — APRENDIZAJE */}
        <section className="sec" id="aprendizaje">
          <div className="sec-head" data-anim="rise">
            <div className="num">03 · Lo que vas a aprender</div>
            <h2>
              Charlas, paneles y <em>talleres</em>.
            </h2>
            <p>
              Charlas, paneles y talleres dictados a lo largo del fin de semana
              para apoyar lo que tu equipo necesita construir.
            </p>
          </div>

          <div className="learn-grid" data-stagger>
            {learn.map((l) => (
              <article className="track" key={l.num}>
                <div className="row">
                  <span className="tag">{l.num}</span>
                </div>
                <h3>{l.title}</h3>
                <p className="desc">{l.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 04 — PREMIOS */}
        <section className="sec" id="premios">
          <div className="sec-head" data-anim="rise">
            <div className="num">04 · Premios</div>
            <h2>
              Los <em>premios</em>.
            </h2>
            <p>{prize.sub}</p>
          </div>

          <div className="prizes" data-stagger>
            {prize.breakdown.map((row) => (
              <article className="prize-card" key={row.place}>
                <span className="pos">{row.place}</span>
                <div className="amt">
                  {row.amount} <em>{row.amountEm}</em>
                </div>
                <div className="det">{row.detail}</div>
              </article>
            ))}
          </div>
        </section>

        {/* 05 — SPONSORS */}
        <section className="sec" id="sponsors">
          <div className="sec-head" data-anim="rise">
            <div className="num">05 · Sponsors</div>
            <h2>
              Las marcas que <em>hacen posible</em> esta edición.
            </h2>
          </div>

          <div className="sponsors-block" data-stagger>
            {sponsors.map((tier) => {
              const cardClass =
                tier.tier === "main"
                  ? "main"
                  : tier.tier === "platinum"
                  ? "plat"
                  : "gold";
              const defaultH =
                tier.tier === "main"
                  ? { hMin: 69, vw: 6.7, hMax: 96 }
                  : tier.tier === "platinum"
                  ? { hMin: 40, vw: 3.9, hMax: 56 }
                  : { hMin: 32, vw: 3.1, hMax: 44 };
              return (
                <div className="sponsors-tier" key={tier.tier}>
                  <div className="lbl">{tier.label}</div>
                  <div className="sponsors-row">
                    {tier.items.map((s) => {
                      const h = s.h ?? defaultH.hMax;
                      const hMin = Math.round(h * 0.72);
                      const vw = ((h / 14.4)).toFixed(2);
                      const cls = [
                        "sponsor-card",
                        cardClass,
                        s.invert ? "invert" : "",
                        s.tight ? "tight" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <div className={cls} key={s.name}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.logo}
                            alt={s.name}
                            style={{
                              height: `clamp(${hMin}px, ${vw}vw, ${h}px)`,
                            }}
                            loading="lazy"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sponsor-cta">
            <a
              href={`mailto:${meta.contactEmail}?subject=Sponsorship%20Hackath%C3%B3n%20de%20Negocios%202026`}
              className="btn-secondary"
            >
              Quiero ser sponsor <span style={{ opacity: 0.6 }}>↗</span>
            </a>
            <span style={{ color: "var(--hk-cream-dim)", fontSize: 14 }}>
              o escribinos a{" "}
              <a href={`mailto:${meta.contactEmail}`} className="underline">
                {meta.contactEmail}
              </a>
            </span>
          </div>
        </section>

        {/* 07 — FAQ */}
        <section className="sec" id="faq">
          <div className="sec-head" data-anim="rise">
            <div className="num">06 · Preguntas frecuentes</div>
            <h2>
              Preguntas <em>frecuentes</em>.
            </h2>
          </div>

          <div className="faq" data-stagger>
            {faq.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>
                  <span>{item.q}</span>
                  <span className="chev">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 07 — CLOSING */}
        <section className="closing" id="cta" data-anim="scale">
          <div className="num">Y-Hat · 2026</div>
          <h2>
            El futuro no se <em>adivina</em>, se modela.
          </h2>
          <p>
            Las inscripciones cierran el 29 de mayo.
            <br />
            Confirmamos cupos por mail al cierre del proceso.
          </p>
          <div className="actions">
            <a
              href={meta.ctas.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Inscribirme <span className="ar">→</span>
            </a>
            <a
              href={meta.ctas.secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              ¿No tenés equipo? Formalo acá ↗
            </a>
          </div>
        </section>
      </div>

      {/* FOOTER (out of snap) */}
      <footer>
        <div className="wrap">
          <div className="top">
            <div className="brand">
              <div className="head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
                <span>Y-Hat</span>
              </div>
              <p>
                El punto de encuentro entre la comunidad estudiantil y el
                ecosistema de innovación.
              </p>
            </div>
            <div>
              <h5>Hackathón</h5>
              <a href="#hackathon">El hackathón</a>
              <a href="#aprendizaje">Aprendizaje</a>
              <a href="#tracks">Tracks</a>
              <a href="#premios">Premios</a>
            </div>
            <div>
              <h5>Sumarse</h5>
              <a
                href={meta.ctas.primary.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inscripción ↗
              </a>
              <a
                href={meta.ctas.secondary.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Armá tu equipo ↗
              </a>
              <a href="#sponsors">Sponsors</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h5>Y-Hat</h5>
              <Link href="/">somosyhat.com ↗</Link>
              <a
                href="https://www.instagram.com/somos.yhat"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.linkedin.com/company/y-hat"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn ↗
              </a>
            </div>
          </div>
          <div className="bot">
            <span>© 2026 Y-Hat</span>
            <span>Primera Edición</span>
          </div>
        </div>
      </footer>

      {/* STICKY CTA */}
      <div
        ref={stickyRef}
        className="sticky-cta"
        role="region"
        aria-label="Inscripción"
      >
        <span className="dot"></span>
        <span>
          <b>Inscripciones abiertas</b> · cierran 29 may
        </span>
        <a
          href={meta.ctas.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Inscribirme <span className="ar">→</span>
        </a>
      </div>

      {/* SIDE NAV (desktop snap only — hidden via CSS on mobile) */}
      <nav className="snap-nav" aria-label="Navegación por secciones">
        <div className="snap-nav-bg" aria-hidden="true"></div>
        <ul>
          {SECTION_IDS.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                className={i === activeIdx ? "active" : ""}
                aria-label={`Ir a ${SECTION_LABELS[id]}`}
                onClick={(e) => {
                  goTo(i);
                  (e.currentTarget as HTMLButtonElement).blur();
                }}
              >
                <span className="lbl">{SECTION_LABELS[id]}</span>
                <span className="dot" aria-hidden="true"></span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
