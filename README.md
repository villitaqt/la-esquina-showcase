# La Esquina POS · muestra

Página de muestra (no de venta) del sistema de punto de venta de La Esquina, contada como una
noche de servicio: de la apertura de caja a las 16:52 al cierre a las 23:58.

Estilo **nocturno de restaurante**: fondo cálido casi negro, pantallas que se encienden al entrar en
vista, una luz de lámpara que sigue al puntero, grano de película y un reloj del relato que avanza
con el scroll.

## Verla

Sin dependencias ni compilación:

```bash
node servir.mjs        # http://localhost:4321
```

También se puede abrir `index.html` directo en el navegador. Las fuentes (Archivo, Instrument Serif,
JetBrains Mono) vienen de Google Fonts; sin internet se usa la fuente del sistema.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la página: hero, cinta, los 8 capítulos de la noche, cómo está hecho, galería, pie |
| `styles.css` | Paleta y tipografía en variables de `:root`; responsivo y `prefers-reduced-motion` |
| `main.js` | Reloj, lámpara, revelado al hacer scroll, encendido de pantallas, ticket que se imprime, contadores, reloj del relato, galería y visor |
| `capturas/` | Capturas reales del POS (2880×1620 escritorio, 1170×2532 celular) |
| `herramientas/` | Scripts con los que se tomaron las capturas |

## Volver a tomar las capturas

Las capturas salen del POS real (`../pos-system`) con una base **temporal**, así la base de
desarrollo no se toca:

1. Levantar el backend con otra carpeta de datos (siembra datos de ejemplo):
   `set POS_DATA_DIR=C:\ruta\temporal&& npm run dev` en `pos-system/backend`.
2. Levantar el frontend (`npm run dev` en `pos-system/frontend`, puerto 5173).
3. En `herramientas/`: `node poblar.mjs`, `node ajustes.mjs` (nombre "LA ESQUINA" y tema oscuro) y
   `POS_DATA_DIR=... node mas-ventas.mjs` (reparte las ventas entre las 17:00 y las 23:00).
4. `node capturar.mjs` (o `node capturar.mjs ventas cocina` para rehacer solo algunas).

`capturar.mjs` usa Edge/Chrome sin ventana a través del cliente CDP de
`~/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs`.
