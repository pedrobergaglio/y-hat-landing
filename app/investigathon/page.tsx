"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import data from "@/data/investigathon.json";
import HeroField from "./hero-field";
import { buildEvents, googleCalendarUrl, googleSubscribeUrl } from "./calendar-export";

/* ---------- constants ---------- */

const SECTION_IDS = ["top", "fechas", "tracks", "faq", "cta"];

const SECTION_LABELS: Record<string, string> = {
  top: "Inicio",
  fechas: "Fechas",
  tracks: "Tracks",
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

/* ---------- calendar ---------- */

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function weekDays(startISO: string) {
  const d = new Date(`${startISO}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return { n: day.getDate(), wd: WEEKDAYS[i], weekend: i >= 5, iso: day.toISOString().slice(0, 10) };
  });
}

/* ---------- types ---------- */

type Track = {
  key: string;
  title: string;
  labs: string[];
  desc: string;
  pending?: boolean;
};
type Fact = { label: string; value: string; hint: string };
type Phase = { title: string; range: string; desc: string; items: string[] };
type Block = { from: number; to: number; kind: string; label?: string; time?: string };
type Week = { start: string; blocks: Block[] };

const SITE_URL = "https://somosyhat.com/investigathon";
const ICS_PATH = "/investigathon/investigathon-2026.ics";
const ICS_URL = `https://somosyhat.com${ICS_PATH}`;

/* ---------- page ---------- */

export default function InvestigathonPage() {
  const { meta, faq } = data;
  const facts = data.facts as Fact[];
  const tracks = data.tracks as Track[];
  const phases = data.phases as Phase[];
  const weeks = data.schedule.weeks as Week[];
  const eventMeta = {
    title: meta.title,
    location: `${meta.venue.name}, ${meta.venue.campus}`,
    url: SITE_URL,
  };
  const googleUrlFor = (w: Week, bk: Block) => {
    const [ev] = buildEvents([{ start: w.start, blocks: [bk] }], eventMeta);
    return ev ? googleCalendarUrl(ev) : undefined;
  };

  const [activeIdx, setActiveIdx] = useState(0);
  const currentIndexRef = useRef(0);
  const lockedRef = useRef(false);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, force = false) => {
    const sections = sectionsRef.current;
    if (!sections.length) return;
    const next = Math.max(0, Math.min(sections.length - 1, index));
    if ((next === currentIndexRef.current && !force) || lockedRef.current) return;
    lockedRef.current = true;
    currentIndexRef.current = next;
    // Index 0 goes to the very top so the sticky bar is fully in view.
    const targetY =
      next === 0 ? 0 : sections[next].getBoundingClientRect().top + window.scrollY;
    smoothScrollTo(targetY, DURATION);
    setActiveIdx(next);
    setTimeout(() => {
      lockedRef.current = false;
    }, LOCK_HOLD);
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
        ".sec-body, .tracks, .faq"
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

    // Document-relative top. offsetTop would be relative to .wrap, which is
    // positioned, and would be off by the top bar's height.
    const docTop = (el: HTMLElement) =>
      el.getBoundingClientRect().top + window.scrollY;
    function isPastLastSnap() {
      if (!sections.length) return false;
      return window.scrollY > docTop(sections[sections.length - 1]) + 40;
    }
    function isAtLastSnap() {
      if (!sections.length) return false;
      return Math.abs(window.scrollY - docTop(sections[sections.length - 1])) < 40;
    }

    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (!isDesktop()) return;
      if (isPastLastSnap()) {
        if (e.deltaY >= 0) return; // native scroll to reach the rest of the last panel
        e.preventDefault();
        goTo(sections.length - 1, true);
        return;
      }
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
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName ?? "";
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

    /* Anchor hijack: intercept #-links in desktop snap mode */
    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    );
    const handlers: Array<{
      el: HTMLAnchorElement;
      fn: (e: MouseEvent) => void;
    }> = [];
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

  const primaryHref = meta.ctas.primary.href;

  return (
    <div ref={rootRef}>
      {/* TOP BAR */}
      <header className="topbar">
        <div className="in">
          <a href="#top" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
            <span>Y-Hat</span>
          </a>
          <nav className="links" aria-label="Secciones">
            <a href="#fechas">Fechas</a>
            <a href="#tracks">Los problemas</a>
            <a href="#faq">FAQ</a>
          </nav>
          <span className="edition">{meta.edition} · Octubre 2026 · FCEN, UBA</span>
          <a
            href={primaryHref}
            target="_blank"
            rel="noopener noreferrer"
            className="cta"
          >
            Inscribirme
          </a>
        </div>
      </header>

      <div className="wrap">
        {/* HERO */}
        <section className="hero" id="top">
          <HeroField />
          <div className="grid">
            <div>
              <h1>Investigathon</h1>
              <p className="word">{meta.subtitle}.</p>

              <p className="lede">
                <strong>Competencia de investigación</strong> en la que equipos
                de estudiantes abordan problemas científicos reales propuestos
                por laboratorios de la FCEN, acompañados por sus
                investigadorxs.
              </p>

              <div className="actions">
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {meta.ctas.primary.label}
                </a>
                <a href="#tracks" className="btn-secondary">
                  Ver los cuatro problemas
                </a>
              </div>
            </div>

            <dl className="meta">
              {facts.map((f) => (
                <div className="row" key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.value}
                    <small>{f.hint}</small>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 01 — FECHAS */}
        <section className="sec" id="fechas">
          <div className="sec-head">
            <div className="roman">I</div>
            <div>
              <h2>
                Una escuela, tres fases, <em>una final</em>.
              </h2>
              <p>
                Una semana de escuela, tres fases de trabajo con un checkpoint
                por semana, y la Gran final el viernes 30 en 0+Infinito.
              </p>
            </div>
          </div>

          <div className="split">
            <div className="split-left">
              <div className="phases">
                {phases.map((p) => (
                  <article className="phase" key={p.title}>
                    <div className="head">
                      <h3>{p.title}</h3>
                      <span className="range">{p.range}</span>
                    </div>
                    <p>{p.desc}</p>
                    <ul>
                      {p.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className="split-right">
              <div className="calendar" aria-label="Calendario del evento">
                {weeks.map((w) => {
                  const days = weekDays(w.start);
                  return (
                    <div className="week" key={w.start}>
                      {days.map((d) => (
                        <div className={`day${d.weekend ? " wk" : ""}`} key={d.iso}>
                          {d.wd}
                          <b>{d.n}</b>
                        </div>
                      ))}
                      {w.blocks.map((bk) => {
                        const cls = `block ${bk.kind}${bk.from === 0 ? " first" : ""}`;
                        const style = { gridColumn: `${bk.from + 1} / ${bk.to + 2}` };
                        const href = bk.time ? googleUrlFor(w, bk) : undefined;
                        const inner = (
                          <>
                            {bk.label && <span>{bk.label}</span>}
                            {bk.time && <span className="t">{bk.time}</span>}
                          </>
                        );
                        return href ? (
                          <a
                            key={`${w.start}-${bk.from}`}
                            className={`${cls} link`}
                            style={style}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Agregar "${bk.label}" a Google Calendar`}
                          >
                            {inner}
                          </a>
                        ) : (
                          <div key={`${w.start}-${bk.from}`} className={cls} style={style}>
                            {inner}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="cal-actions">
                <a
                  href={googleSubscribeUrl(ICS_URL)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary small"
                >
                  Agregar a Google Calendar
                </a>
                <a href={ICS_PATH} download className="btn-secondary small">
                  Apple Calendar / Outlook
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — LOS PROBLEMAS */}
        <section className="sec" id="tracks">
          <div className="sec-head">
            <div className="roman">II</div>
            <div>
              <h2>
                Cuatro <em>tracks</em>, cuatro laboratorios.
              </h2>
              <p>
                Cada laboratorio propone un problema y ellos mismos son el
                jurado. Vos y tu grupo eligen uno para competir.
              </p>
            </div>
          </div>

          <div className="sec-body">
          <div className="tracks">
            {tracks.map((t, i) => (
              <article
                className={`track${t.pending ? " pending" : ""}`}
                key={t.key}
              >
                <div className="ord">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h3>{t.title}</h3>
                  <div className="lab">
                    {t.labs.join(" y ")} <span>· jurado del track</span>
                  </div>
                </div>
                <p
                  className="desc"
                  dangerouslySetInnerHTML={{ __html: t.desc }}
                />
              </article>
            ))}
          </div>
          </div>
        </section>

        {/* 03 — FAQ */}
        <section className="sec" id="faq">
          <div className="sec-head">
            <div className="roman">III</div>
            <div>
              <h2>
                Preguntas <em>frecuentes</em>.
              </h2>
            </div>
          </div>

          <div className="sec-body">
          <div className="faq">
            {faq.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>
                  <span>{item.q}</span>
                  <span className="chev">+</span>
                </summary>
                <p dangerouslySetInnerHTML={{ __html: item.a }} />
              </details>
            ))}
          </div>
          </div>
        </section>

        {/* 04 — CLOSING + FOOTER (one panel) */}
        <section className="closing" id="cta">
          <div className="closing-body">
            <h2>
              El futuro no se <em>adivina</em>, se modela.
            </h2>
            <p>
              Las inscripciones están abiertas.
              <br />
              Se inscribe una sola vez por grupo y elegís el track en el
              formulario.
            </p>
            <div className="actions">
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                {meta.ctas.primary.label}
              </a>
            </div>
          </div>

          <footer>
            <div className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
              <span>Y-Hat</span>
              <span className="copy">© 2026</span>
            </div>
            <nav className="links" aria-label="Y-Hat">
              <Link href="/">somosyhat.com</Link>
              <Link href="/hackathon">Hackathón de Negocios</Link>
              <a
                href="https://www.instagram.com/somos.yhat"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/company/y-hat"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              <a href={`mailto:${meta.contactEmail}`}>{meta.contactEmail}</a>
            </nav>
          </footer>
        </section>
      </div>

      {/* SIDE NAV (desktop snap only; hidden via CSS on mobile) */}
      <nav className="snap-nav" aria-label="Navegación por secciones">
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
