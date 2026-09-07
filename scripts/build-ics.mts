/* Writes the public .ics for /investigathon from data/investigathon.json.
   Runs before `next build` (see package.json) and can be run by hand with
   `npm run ics`. The file is committed so the dev server serves it too. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildEvents, toICS, type Week } from "../app/investigathon/calendar-export.ts";

const data = JSON.parse(readFileSync("data/investigathon.json", "utf8"));
const meta = {
  title: data.meta.title as string,
  location: `${data.meta.venue.name}, ${data.meta.venue.campus}`,
  url: "https://somosyhat.com/investigathon",
};
const ics = toICS(buildEvents(data.schedule.weeks as Week[], meta), meta);
mkdirSync("public/investigathon", { recursive: true });
writeFileSync("public/investigathon/investigathon-2026.ics", ics);
console.log(`wrote public/investigathon/investigathon-2026.ics (${ics.length} bytes)`);
