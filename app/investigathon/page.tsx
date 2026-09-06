"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import data from "@/data/investigathon.json";

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

const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

type Day = { iso: string; n: number; wd: string; weekend: boolean; phase?: string };

function buildDays(
  startISO: string,
  endISO: string,
  phases: { dateISO: string; title: string }[]
): Day[] {
  const out: Day[] = [];
  const d = new Date(`${startISO}T12:00:00`);
  const end = new Date(`${endISO}T12:00:00`);
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    out.push({
      iso,
      n: d.getDate(),
      wd: WEEKDAYS[dow],
      weekend: dow === 0 || dow === 6,
      phase: phases.find((p) => p.dateISO === iso)?.title,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/* ---------- types ---------- */

type Track = {
  key: string;
  title: string;
  labs: string[];
  desc: string;
  pending?: boolean;
};
type Fact = {
  label: string;
  value?: string;
  valueEm?: string;
  hint: string;
};
type Phase = {
  week: string;
  date: string;
  dateISO: string;
  title: string;
  desc: string;
  items: string[];
};

/* ---------- page ---------- */

export default function InvestigathonPage() {
  const { meta, faq } = data;
  const facts = data.facts as Fact[];
  const tracks = data.tracks as Track[];
  const phases = data.phases as Phase[];

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
        ".tracks, .faq"
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
  const days = buildDays(meta.dates.start, meta.dates.end, phases);

  return (
    <div ref={rootRef}>
      {/* NAV (mobile only in snap mode) */}
      <nav className="top">
        <a href="#top" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
          <span>Investigathon</span>
        </a>
        <span className="links">
          <a href="#fechas">Fechas</a>
          <a href="#tracks">Tracks</a>
          <a href="#faq">FAQ</a>
        </span>
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className="cta"
        >
          Inscribirme
        </a>
      </nav>

      <div className="wrap">
        {/* HERO */}
        <section className="hero" id="top">
          <div className="masthead">
            <div className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hackathon/logo-yhat.svg" alt="Y-Hat" />
              <span>Y-Hat</span>
            </div>
            <span className="edition">
              {meta.edition} · Octubre 2026 · FCEN, UBA
            </span>
          </div>

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
                    {f.value ? <>{f.value} </> : null}
                    {f.valueEm ? <em>{f.valueEm}</em> : null}
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
                Tres fases <em>en tres semanas</em>.
              </h2>
              <p>
                Del viernes 16 al viernes 30 de octubre, con un encuentro por
                semana en 0+Infinito y trabajo acompañado entre medio.
              </p>
            </div>
          </div>

          <div className="sec-body">
          <div className="calendar" aria-label="Calendario del evento">
            {days.map((d) => (
              <div
                key={d.iso}
                className={`day${d.weekend ? " weekend" : ""}${d.phase ? " event" : ""}`}
              >
                {d.phase && <span className="tag">{d.phase}</span>}
                <span className="wd">{d.wd}</span>
                <span className="n">{d.n}</span>
              </div>
            ))}
          </div>

          <div className="timeline">
            {phases.map((p) => (
              <article className="phase" key={p.dateISO}>
                <div className="head">
                  <span className="week">{p.week}</span>
                  <time dateTime={p.dateISO}>{p.date}</time>
                </div>
                <h3>{p.title}</h3>
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

        {/* 04 — CLOSING */}
        <section className="closing" id="cta">
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
              <h5>Investigathon</h5>
              <a href="#fechas">Fechas</a>
              <a href="#tracks">Los problemas</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h5>Sumarse</h5>
              <a href={primaryHref} target="_blank" rel="noopener noreferrer">
                Inscripción
              </a>
              <a href={`mailto:${meta.contactEmail}`}>{meta.contactEmail}</a>
            </div>
            <div>
              <h5>Y-Hat</h5>
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
            </div>
          </div>
          <div className="bot">
            <span>© 2026 Y-Hat</span>
            <span>{meta.edition}</span>
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
        <span>Inscripciones abiertas, una por grupo</span>
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Inscribirme
        </a>
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
