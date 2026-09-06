/* Turns the schedule blocks into calendar events, a Google Calendar
   template URL per event, and one .ics file for everything. Pure functions;
   no DOM. Times in the JSON are Buenos Aires local (UTC-3, no DST). */

export type Block = { from: number; to: number; kind: string; label?: string; time?: string };
export type Week = { start: string; blocks: Block[] };
export type EventMeta = { title: string; location: string; url: string };
export type CalEvent = {
  id: string;
  title: string;
  start: string; // yyyymmddThhmmssZ, or yyyymmdd when allDay
  end: string;
  allDay: boolean;
  location: string;
  description: string;
};

const TZ = "America/Argentina/Buenos_Aires";
const UTC_OFFSET_HOURS = 3; // local = UTC-3

const pad = (n: number) => String(n).padStart(2, "0");

function addDays(iso: string, days: number): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days));
}
const dateStamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

function utcStamp(day: Date, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h + UTC_OFFSET_HOURS, m));
  return `${dateStamp(t)}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`;
}

/** "09:30 a 14:15" -> ["09:30", "14:15"] */
function parseRange(time: string): [string, string] | null {
  const m = time.match(/(\d{1,2}:\d{2})\s*a\s*(\d{1,2}:\d{2})/);
  return m ? [m[1], m[2]] : null;
}

export function buildEvents(weeks: Week[], meta: EventMeta): CalEvent[] {
  const out: CalEvent[] = [];
  for (const w of weeks) {
    for (const b of w.blocks) {
      if (!b.label || b.kind === "trabajo" || b.kind === "off") continue;
      const day = addDays(w.start, b.from);
      const title = `${meta.title} · ${b.label}`;
      const base = {
        id: `${dateStamp(day)}-${b.kind}-${b.from}`,
        title,
        location: meta.location,
        description: meta.url,
      };
      const range = b.time ? parseRange(b.time) : null;
      if (range) {
        out.push({ ...base, allDay: false, start: utcStamp(day, range[0]), end: utcStamp(day, range[1]) });
      } else {
        // All-day span; DTEND is exclusive in iCalendar.
        out.push({
          ...base,
          allDay: true,
          start: dateStamp(day),
          end: dateStamp(addDays(w.start, b.to + 1)),
        });
      }
    }
  }
  return out;
}

export function googleCalendarUrl(e: CalEvent): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${e.start}/${e.end}`,
    details: e.description,
    location: e.location,
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function toICS(events: CalEvent[], meta: EventMeta): string {
  const host = new URL(meta.url).hostname;
  const now = new Date();
  const stamp = `${dateStamp(now)}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Y-Hat//Investigathon//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(meta.title)}`,
    `X-WR-TIMEZONE:${TZ}`,
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@${host}`,
      `DTSTAMP:${stamp}`,
      e.allDay ? `DTSTART;VALUE=DATE:${e.start}` : `DTSTART:${e.start}`,
      e.allDay ? `DTEND;VALUE=DATE:${e.end}` : `DTEND:${e.end}`,
      `SUMMARY:${esc(e.title)}`,
      `LOCATION:${esc(e.location)}`,
      `DESCRIPTION:${esc(e.description)}`,
      `URL:${e.description}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
