# Cable Harness Designer

A zero-install, single-page web tool for designing simple point-to-point wiring
harnesses — built for the JST-GH cables used all over drone builds, in the spirit of
[WireViz](https://github.com/wireviz/WireViz) but driven by a form UI instead of YAML.

Define two connectors (or a connector-to-pigtail), map pins to wires with colors and
twisted-pair groups, and watch an engineering-drawing-style diagram update live. Export
the result as SVG, vector PDF, or save/load the design as JSON.

## Features

- **JST-GH / JST-PH / custom connector presets** with per-pin signal labels
- **Latch-up / latch-down orientation** per connector — the drawing shows the latch
  clip and mirrors the pin numbering the way the physical part actually sits
- **Twisted pairs** — group two wires and they render as a twisted run
- **Validity checks** — duplicate pin use and malformed pair groups are flagged inline
- **Manufacturing data** — cable length, wire gauge, and optional strip length and
  crimp terminal/tool references, all harness-wide
- **Exports** — standalone SVG, vector PDF (via svg2pdf.js), and JSON save/load
- **No build step, no server** — plain HTML/CSS/JS; open `index.html` directly or host
  it as static files

## Usage

Open `index.html` in a browser, or serve the folder statically:

```bash
python -m http.server
```

All third-party libraries (jsPDF, svg2pdf.js, Preact+htm) are vendored in `js/lib/`,
so it works fully offline.

## Layout

```
index.html          app shell and script load order
css/styles.css      UI styles + diagram (engineering drawing) styles
js/core/            pub/sub store and the Harness data model
js/data/            wire color palette, connector presets, validity checks
js/ui/              form bindings (vanilla) and wire table / pin labels (Preact+htm)
js/diagram/         pure layout geometry, connector artwork, SVG renderer
js/export/          SVG, PDF, and JSON export
js/lib/             vendored third-party libraries
```
