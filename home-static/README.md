# home-static — la home de somosyhat.com

La página `/` que se sirve en producción **no la genera Next**: es este HTML estático,
construido aparte en junio de 2026. `app/page.tsx` sigue teniendo la home vieja de
octubre de 2025 y no se usa.

El script `postbuild` de `package.json` copia esta carpeta sobre `out/` después de cada
`npm run build`, para que la home sobreviva al build. Sin ese paso, `next build`
regenera `out/index.html` desde `app/page.tsx` y la home vuelve a la versión vieja:
eso pasó el 7 de septiembre de 2026 y estuvo así hasta que se restauró desde una copia
suelta que había quedado en el servidor.

**Si en algún momento se porta esta home a componentes de Next** (está esbozado en
`PORTING_PLAN.md`), hay que borrar esta carpeta y sacar el `postbuild` del `package.json`
en el mismo cambio. Mientras tanto, cualquier edición de la home se hace acá.

Las otras rutas (`/hackathon`, `/investigathon`) sí las genera Next normalmente y el
postbuild no las toca.
