import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEvents, googleCalendarUrl, toICS } from "./calendar-export.ts";

const weeks = [
  {
    start: "2026-10-12",
    blocks: [
      { from: 0, to: 3, kind: "escuela", label: "Escuela Investigathón" },
      { from: 4, to: 4, kind: "hito", label: "Apertura", time: "09:30 a 14:15" },
      { from: 5, to: 6, kind: "trabajo", label: "Trabajo · Fase 1" },
    ],
  },
  {
    start: "2026-10-26",
    blocks: [
      { from: 4, to: 4, kind: "final", label: "Gran final", time: "14:00 a 21:00" },
      { from: 5, to: 6, kind: "off" },
    ],
  },
];

const meta = {
  title: "Investigathon 2026",
  location: "0+Infinito, Ciudad Universitaria, Buenos Aires",
  url: "https://somosyhat.com/investigathon",
};

test("buildEvents: timed blocks become UTC events (Buenos Aires is UTC-3)", () => {
  const ev = buildEvents(weeks, meta);
  const apertura = ev.find((e) => e.title.includes("Apertura"));
  assert.ok(apertura);
  assert.equal(apertura.start, "20261016T123000Z");
  assert.equal(apertura.end, "20261016T171500Z");
  assert.equal(apertura.allDay, false);
});

test("buildEvents: the school week is one all-day span; work and off blocks are skipped", () => {
  const ev = buildEvents(weeks, meta);
  const escuela = ev.find((e) => e.title.includes("Escuela"));
  assert.ok(escuela);
  assert.equal(escuela.allDay, true);
  assert.equal(escuela.start, "20261012");
  assert.equal(escuela.end, "20261016"); // DTEND is exclusive
  assert.equal(ev.length, 3);
});

test("googleCalendarUrl: prefilled template with dates and timezone", () => {
  const [apertura] = buildEvents(weeks, meta).filter((e) => !e.allDay);
  const url = new URL(googleCalendarUrl(apertura));
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("dates"), "20261016T123000Z/20261016T171500Z");
  assert.equal(url.searchParams.get("ctz"), "America/Argentina/Buenos_Aires");
  assert.equal(url.searchParams.get("location"), meta.location);
  assert.match(url.searchParams.get("text") ?? "", /Apertura/);
});

test("toICS: valid VCALENDAR with one VEVENT per event, CRLF lines, escaped commas", () => {
  const ics = toICS(buildEvents(weeks, meta), meta);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 3);
  assert.match(ics, /DTSTART;VALUE=DATE:20261012\r\nDTEND;VALUE=DATE:20261016/);
  assert.match(ics, /DTSTART:20261016T123000Z/);
  assert.match(ics, /LOCATION:0\+Infinito\\, Ciudad Universitaria\\, Buenos Aires/);
  assert.match(ics, /UID:[^\r\n]+@somosyhat\.com/);
  assert.ok(!/(^|[^\r])\n/.test(ics), "every line break is CRLF");
});
