"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Plus,
} from "lucide-react";

import data from "@/data/hackathon.json";

/* ---------- shared bits ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function SectionHead({
  num,
  title,
  emphasis,
  sub,
}: {
  num: string;
  title: string;
  emphasis?: string;
  sub?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs tracking-[0.3em] uppercase text-[var(--hk-cream-dim)] mb-4">
        — {num}
      </div>
      <h2 className="text-4xl md:text-6xl leading-[1.05] mb-5">
        {title}
        {emphasis && (
          <>
            {" "}
            <em className="not-italic font-normal text-[var(--hk-cream-soft)] [font-style:italic]">
              {emphasis}
            </em>
            .
          </>
        )}
      </h2>
      {sub && (
        <p className="text-lg md:text-xl text-[var(--hk-cream-soft)] max-w-2xl">
          {sub}
        </p>
      )}
    </div>
  );
}

function YHatMark({ className = "" }: { className?: string }) {
  // Official Ŷ mark exported from the comms team's Figma.
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/hackathon/logo-yhat.svg"
      alt="Y-Hat"
      className={className}
    />
  );
}

/* ---------- page ---------- */

export default function HackathonPage() {
  const { meta, ticker, prize, about, phases, learn, tracks, schedule, sponsors, faq } = data;

  return (
    <main className="relative overflow-hidden">
      {/* Top ticker */}
      <div
        className="relative overflow-hidden border-b border-[var(--hk-cream-line)] py-3 text-xs tracking-[0.25em] uppercase"
        aria-hidden
      >
        <div className="hk-marquee">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {ticker.map((t, i) => (
                <span key={`${dup}-${i}`} className="flex items-center pr-10">
                  <span className="opacity-90">{t}</span>
                  <span className="ml-10 inline-block h-1.5 w-1.5 rounded-full bg-[var(--hk-cream)] opacity-60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--hk-burgundy)]/85 border-b border-[var(--hk-cream-line)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/hackathon" className="flex items-center gap-3">
            <YHatMark className="h-7 w-auto text-[var(--hk-cream)]" />
            <span className="font-serif text-lg tracking-tight">Hackathón de Negocios</span>
          </Link>
          <nav aria-label="Secciones" className="hidden md:flex items-center gap-7 text-sm text-[var(--hk-cream-soft)]">
            <a href="#hackathon" className="hover:text-[var(--hk-cream)] transition">El hackathón</a>
            <a href="#aprendizaje" className="hover:text-[var(--hk-cream)] transition">Aprendizaje</a>
            <a href="#tracks" className="hover:text-[var(--hk-cream)] transition">Tracks</a>
            <a href="#cronograma" className="hover:text-[var(--hk-cream)] transition">Cronograma</a>
            <a href="#sponsors" className="hover:text-[var(--hk-cream)] transition">Sponsors</a>
            <a href="#faq" className="hover:text-[var(--hk-cream)] transition">FAQ</a>
          </nav>
          <a
            href={meta.ctas.primary.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[var(--hk-cream)] text-[var(--hk-burgundy-deep)] px-4 py-2 text-sm font-medium hover:opacity-95 transition"
          >
            {meta.ctas.primary.label}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative">
        <div className="container mx-auto px-6 pt-20 pb-28 md:pt-32 md:pb-40">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xs tracking-[0.35em] uppercase text-[var(--hk-cream-dim)] mb-6"
              >
                {meta.host} · {meta.edition}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.05 }}
                className="font-serif text-[clamp(3rem,9vw,8rem)] leading-[0.95] tracking-tight"
              >
                Hackathón
                <br />
                <em className="not-italic [font-style:italic] font-normal text-[var(--hk-cream-soft)]">
                  de Negocios
                </em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-8 text-lg md:text-xl text-[var(--hk-cream-soft)] max-w-2xl"
              >
                {meta.tagline}. Tres días para transformar descubrimientos
                científicos e ideas innovadoras en{" "}
                <strong className="text-[var(--hk-cream)] font-medium">
                  propuestas de valor concretas y viables
                </strong>
                .
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <a
                  href={meta.ctas.primary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-full bg-[var(--hk-cream)] text-[var(--hk-burgundy-deep)] px-7 py-4 text-base font-medium hover:opacity-95 transition"
                >
                  {meta.ctas.primary.label}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
                <a
                  href="#hackathon"
                  className="inline-flex items-center gap-2 text-sm text-[var(--hk-cream-soft)] hover:text-[var(--hk-cream)] transition"
                >
                  ¿Qué es esto? ↓
                </a>
              </motion.div>
            </div>

            {/* Big Ŷ as visual anchor */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:block opacity-[0.18]"
              aria-hidden
            >
              <YHatMark className="w-[420px] h-auto text-[var(--hk-cream)]" />
            </motion.div>
          </div>

          {/* Facts strip */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--hk-cream-line)] border border-[var(--hk-cream-line)] rounded-2xl overflow-hidden"
          >
            {[
              {
                icon: <Calendar className="h-4 w-4" />,
                label: "Cuándo",
                value: "5 — 7 Junio",
                hint: "2026",
              },
              {
                icon: <MapPin className="h-4 w-4" />,
                label: "Dónde",
                value: meta.venue.name,
                hint: meta.venue.campus,
              },
              {
                icon: <Users className="h-4 w-4" />,
                label: "Equipos",
                value: meta.teamSize,
                hint: "3 tracks a elección",
              },
              {
                icon: <Trophy className="h-4 w-4" />,
                label: "Premio",
                value: "USD 4.500",
                hint: "+ USD 90k en créditos AWS",
              },
            ].map((f) => (
              <motion.div
                key={f.label}
                variants={fadeUp}
                className="bg-[var(--hk-burgundy)] px-5 py-6"
              >
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[var(--hk-cream-dim)]">
                  {f.icon}
                  {f.label}
                </div>
                <div className="mt-3 font-serif text-2xl md:text-3xl leading-tight">
                  {f.value}
                </div>
                <div className="mt-1 text-xs text-[var(--hk-cream-dim)]">{f.hint}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About + Phases */}
      <section id="hackathon" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead
          num="01"
          title="El"
          emphasis="hackathón"
          sub="Una comunidad viva que busca ser y hacer desde la práctica."
        />

        <div className="mt-16 grid lg:grid-cols-2 gap-16">
          <div className="space-y-6 text-lg text-[var(--hk-cream-soft)] max-w-xl">
            <p>{about.lead}</p>
            <p>{about.mission}</p>
          </div>

          <ul className="space-y-px bg-[var(--hk-cream-line)] border border-[var(--hk-cream-line)] rounded-2xl overflow-hidden">
            {phases.map((p) => (
              <li
                key={p.num}
                className="bg-[var(--hk-burgundy)] flex gap-5 p-6"
              >
                <div className="font-serif text-3xl text-[var(--hk-cream-dim)] leading-none w-12 shrink-0">
                  {p.num}
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-1">{p.title}</h3>
                  <p className="text-sm text-[var(--hk-cream-soft)] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Learn */}
      <section id="aprendizaje" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead
          num="02"
          title="Lo que vas a"
          emphasis="aprender"
          sub="Charlas, paneles y talleres dictados por fundadores, inversores e investigadores. Todo el contenido pensado para que en 72 horas pases de una idea a una propuesta defendible."
        />

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {learn.map((l) => (
            <article
              key={l.num}
              className="border border-[var(--hk-cream-line)] rounded-xl p-6 hover:border-[var(--hk-cream)]/60 transition-colors"
            >
              <div className="text-xs tracking-[0.3em] uppercase text-[var(--hk-cream-dim)] mb-4">
                {l.num}
              </div>
              <h3 className="font-serif text-lg mb-2 leading-snug">{l.title}</h3>
              <p className="text-sm text-[var(--hk-cream-soft)] leading-relaxed">
                {l.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead
          num="03"
          title="Tres"
          emphasis="tracks"
          sub="Cada track tiene su propio jurado, sus mentores y su criterio de evaluación. Vas a poder elegir el tuyo al inscribirte."
        />

        <div className="mt-16 grid lg:grid-cols-3 gap-6">
          {tracks.map((t) => (
            <article
              key={t.tag}
              className="group relative border border-[var(--hk-cream-line)] rounded-2xl p-8 hover:bg-[color:var(--hk-burgundy-deep)] transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs tracking-[0.3em] uppercase text-[var(--hk-cream-dim)]">
                  {t.tag}
                </span>
                <span className="text-3xl" aria-hidden>{t.emoji}</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl leading-tight mb-4">
                {t.title}
              </h3>
              <p className="text-sm text-[var(--hk-cream-soft)] leading-relaxed mb-6">
                {t.subtitle}
              </p>
              <ul className="flex flex-wrap gap-2">
                {t.areas.map((a) => (
                  <li
                    key={a}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--hk-cream-line)] text-[var(--hk-cream-soft)]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Schedule */}
      <section id="cronograma" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead
          num="04"
          title="Tres días,"
          emphasis="sin pausa"
          sub="Charlas, talleres, coworking guiado y panel con VCs. El sábado es el día central."
        />

        <div className="mt-16 grid lg:grid-cols-3 gap-6">
          {schedule.map((day) => {
            const featured = "featured" in day && day.featured;
            return (
              <article
                key={day.pill}
                className={`rounded-2xl p-7 border ${
                  featured
                    ? "bg-[var(--hk-cream)] text-[var(--hk-burgundy-deep)] border-[var(--hk-cream)]"
                    : "border-[var(--hk-cream-line)]"
                }`}
              >
                <div
                  className={`inline-flex text-[10px] tracking-[0.3em] uppercase rounded-full px-3 py-1 mb-5 ${
                    featured
                      ? "bg-[var(--hk-burgundy-deep)] text-[var(--hk-cream)]"
                      : "bg-[var(--hk-cream-faint)] text-[var(--hk-cream-soft)]"
                  }`}
                >
                  {day.pill}
                </div>
                <h3 className="font-serif text-2xl mb-1">{day.title}</h3>
                <p
                  className={`text-sm mb-6 ${
                    featured ? "text-[var(--hk-burgundy-deep)]/70" : "text-[var(--hk-cream-dim)]"
                  }`}
                >
                  {day.hours}
                </p>
                <ol className="space-y-3">
                  {day.items.map((item, i) => (
                    <li key={i} className="flex gap-4 text-sm">
                      <time
                        className={`font-mono tabular-nums w-14 shrink-0 ${
                          featured ? "text-[var(--hk-burgundy-deep)]/70" : "text-[var(--hk-cream-dim)]"
                        }`}
                      >
                        {item.time}
                      </time>
                      <span
                        className={
                          featured ? "text-[var(--hk-burgundy-deep)]" : "text-[var(--hk-cream-soft)]"
                        }
                      >
                        {item.what}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </section>

      {/* Prize / CTA strip — navy for visual contrast against the burgundy page */}
      <section id="pre-inscripcion" className="container mx-auto px-6 py-24 md:py-32">
        <div className="relative rounded-3xl border border-[var(--hk-cream-line)] bg-[color:var(--hk-navy)] p-10 md:p-16 overflow-hidden">
          <YHatMark
            className="absolute -right-10 -bottom-10 w-[320px] h-auto text-[var(--hk-cream)] opacity-[0.06]"
            aria-hidden
          />
          <div className="relative max-w-3xl">
            <div className="text-xs tracking-[0.3em] uppercase text-[var(--hk-cream-dim)] mb-5">
              Pre-inscripciones abiertas
            </div>
            <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-5">
              Asegurate{" "}
              <em className="not-italic [font-style:italic] font-normal text-[var(--hk-cream-soft)]">
                tu lugar
              </em>
              .
            </h2>
            <p className="text-lg text-[var(--hk-cream-soft)] mb-8 max-w-2xl">
              Sumate a la lista de inscripción para confirmar tu cupo y recibir
              novedades de oradores, sponsors, premios y logística.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {prize.breakdown.map((row) => (
                <div
                  key={row.place}
                  className="border border-[var(--hk-cream-line)] rounded-xl p-4"
                >
                  <div className="text-xs uppercase tracking-[0.25em] text-[var(--hk-cream-dim)] mb-2">
                    {row.place}
                  </div>
                  <div className="font-serif text-xl leading-tight">
                    {row.cash ? `${row.cash} + ${row.aws}` : row.aws}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={meta.ctas.primary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-[var(--hk-cream)] text-[var(--hk-burgundy-deep)] px-8 py-4 text-base font-medium hover:opacity-95 transition"
              >
                {meta.ctas.primary.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              {/* Secondary CTA — link pending from comms team */}
              <span
                className="text-sm text-[var(--hk-cream-dim)]"
                title="Pendiente: link al flujo de matchmaking"
              >
                ¿No tenés equipo? Pronto vamos a habilitar un canal para conectarte.
              </span>
            </div>

            <p className="mt-6 text-xs text-[var(--hk-cream-dim)]">
              Gratis · 3 ó 4 personas por equipo · {prize.headline}
            </p>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section id="sponsors" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead
          num="05"
          title="Sponsors"
          sub="Las marcas y organizaciones que hacen posible la Hackathón de Negocios 2026."
        />

        <div className="mt-16 space-y-14">
          {sponsors.map((group) => {
            const isMain = group.tier === "main";
            const isPlatinum = group.tier === "platinum";
            const cellMinWidth = isMain ? "100%" : isPlatinum ? "220px" : "180px";
            const cellPadY = isMain ? "py-14" : isPlatinum ? "py-9" : "py-7";
            const nameSize = isMain
              ? "text-3xl md:text-5xl"
              : isPlatinum
              ? "text-xl md:text-2xl"
              : "text-base md:text-lg";
            return (
              <div key={group.tier}>
                <div className="flex items-baseline justify-between mb-5">
                  <span className="text-xs tracking-[0.35em] uppercase text-[var(--hk-cream-dim)]">
                    {group.label}
                  </span>
                  <span className="text-xs text-[var(--hk-cream-dim)]">
                    {group.items.length} {group.items.length === 1 ? "marca" : "marcas"}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center rounded-2xl border border-[var(--hk-cream-line)] overflow-hidden divide-x divide-y divide-[var(--hk-cream-line)]">
                  {group.items.map((item) => {
                    const logoH = isMain ? "h-20 md:h-28" : isPlatinum ? "h-12 md:h-16" : "h-10 md:h-12";
                    return (
                      <div
                        key={item.name}
                        style={{ flex: `1 1 ${cellMinWidth}`, minWidth: cellMinWidth }}
                        className={`bg-[var(--hk-cream)] flex flex-col items-center justify-center px-6 text-center ${cellPadY}`}
                      >
                        {"logo" in item && item.logo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.logo}
                            alt={item.name}
                            className={`${logoH} w-auto max-w-[80%] object-contain`}
                            loading="lazy"
                          />
                        ) : (
                          <span className={`font-serif leading-tight text-[var(--hk-burgundy-deep)] ${nameSize}`}>
                            {item.name}
                          </span>
                        )}
                        {"subtitle" in item && item.subtitle && (
                          <span className="mt-2 text-xs text-[var(--hk-burgundy-deep)]/70">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <a
            href="mailto:hola@somosyhat.com?subject=Sponsorship%20Hackath%C3%B3n%20de%20Negocios%202026"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hk-cream-line)] hover:border-[var(--hk-cream)]/60 px-5 py-3 text-sm transition"
          >
            Quiero ser sponsor
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <span className="text-sm text-[var(--hk-cream-dim)]">
            o escribinos a{" "}
            <a
              className="underline underline-offset-4 hover:text-[var(--hk-cream)]"
              href="mailto:hola@somosyhat.com"
            >
              hola@somosyhat.com
            </a>
          </span>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-6 py-24 md:py-32">
        <SectionHead num="06" title="Preguntas" emphasis="frecuentes" />

        <div className="mt-14 hk-faq">
          {faq.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-center justify-between gap-6 py-6 text-lg md:text-xl font-serif text-[var(--hk-cream)] hover:text-[var(--hk-cream)]">
                <span>{item.q}</span>
                <Plus className="hk-faq__chev h-5 w-5 shrink-0 text-[var(--hk-cream-soft)]" />
              </summary>
              <div className="pb-6 pr-10 text-[var(--hk-cream-soft)] leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--hk-cream-line)] py-14">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <YHatMark className="h-7 w-auto text-[var(--hk-cream)]" />
              <span className="font-serif text-lg">Y-Hat</span>
            </Link>
            <p className="mt-4 text-sm text-[var(--hk-cream-soft)] max-w-md">
              El punto de encuentro entre la comunidad estudiantil y el
              ecosistema de innovación.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-[var(--hk-cream-dim)] text-xs tracking-[0.25em] uppercase mb-3">
                Hackathón
              </h4>
              <ul className="space-y-2 text-[var(--hk-cream-soft)]">
                <li><a className="hover:text-[var(--hk-cream)]" href="#hackathon">El hackathón</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="#aprendizaje">Aprendizaje</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="#tracks">Tracks</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="#cronograma">Cronograma</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--hk-cream-dim)] text-xs tracking-[0.25em] uppercase mb-3">
                Sumarse
              </h4>
              <ul className="space-y-2 text-[var(--hk-cream-soft)]">
                <li><a className="hover:text-[var(--hk-cream)]" href={meta.ctas.primary.href} target="_blank" rel="noopener noreferrer">Pre-inscripción</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="#sponsors">Sponsors</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--hk-cream-dim)] text-xs tracking-[0.25em] uppercase mb-3">
                Y-Hat
              </h4>
              <ul className="space-y-2 text-[var(--hk-cream-soft)]">
                <li><Link className="hover:text-[var(--hk-cream)]" href="/">Sitio principal</Link></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="https://www.instagram.com/somos.yhat" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a className="hover:text-[var(--hk-cream)]" href="https://www.linkedin.com/company/y-hat" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-10 pt-6 border-t border-[var(--hk-cream-line)] flex flex-wrap justify-between text-xs text-[var(--hk-cream-dim)]">
          <span>© 2026 Y-Hat — Hecho en Ciudad Universitaria</span>
          <span>FCEN · UBA</span>
        </div>
      </footer>
    </main>
  );
}
