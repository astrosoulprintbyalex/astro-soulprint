# Swiss Ephemeris (WebAssembly)

These files run the Swiss Ephemeris inside the visitor's browser for the Birth Chart.

| File | What it is |
|------|-----------|
| `swisseph-browser.js` | JavaScript wrapper from the npm package `@swisseph/browser` 1.4.0 (AGPL-3.0). Only change: the `sourceMappingURL` comment was removed. |
| `swisseph.js`, `swisseph.wasm` | The Swiss Ephemeris C library (version 2.10.03) compiled to WebAssembly, from the same package. |
| `loader.js` | Our own small file: starts the engine and loads the three data files from `../../ephe/`. |
| `LICENSE-AGPL-3.0.txt` | The GNU Affero General Public License v3. |

Swiss Ephemeris is © Astrodienst AG, Zurich, and is dual licensed (GNU AGPL-3.0 or a paid Swiss Ephemeris Professional
License). This website uses it under the **AGPL-3.0**, which is why the chart tool's source code is public and the footer
of the chart page links to it. More: https://www.astro.com/swisseph/

Every number it produces was checked against the native C library (see `../tests/astro.test.js`): they agree to better
than 0.000001 degrees.
