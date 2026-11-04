# FlowDesk

A desktop workspace for flow cytometry analysis. Open FCS files, draw gates,
build a population hierarchy, apply compensation and export the results.
Everything runs locally; no data leaves the machine.

## What it does

- Reads **FCS 3.1** and `.lmd` files — an independent implementation of the
  open specification published by ISAC
- Scatter plots, histograms and quadrant plots
- Polygon, rectangle and quadrant **gates**, organised into a population
  hierarchy
- **Compensation** from the spillover matrix in the file, or edited by hand
- Transforms, including biexponential, for fluorescence channels
- Population **statistics**
- **Templates**, so one gating strategy can be reapplied to other files
- Export to CSV, PNG and FCS through the system save dialog

## Running it

Requires Node.js and npm.

```sh
npm install
npm start
```

## Building the app

```sh
npm run dist:mac    # macOS (universal)
npm run dist:win    # Windows (x64)
npm run dist:dmg    # macOS disk image
```

The packaging scripts expect `build/icon.icns`, `build/Info.extra.plist` and
`build/make_dmg.sh`. Those files are not in this repository yet; add your own
icon and packaging metadata, or drop the `--icon` and `--extend-info` flags from
the scripts in `package.json`.

## Security

The renderer runs with `contextIsolation` and `sandbox` enabled and has no Node
integration. The preload exposes only what the interface needs. Links open in
the system browser rather than in the application window.

## Licence

MIT — see [LICENSE](LICENSE). Third-party content and the relationship to the
FCS standard are described in [NOTICE](NOTICE).
