/* Loads the Swiss Ephemeris (WebAssembly) and its three data files from this website, once.
   Everything is fetched from our own site (no outside servers) and the calculation then runs on the visitor's phone. */
import { SwissEphemeris } from './swisseph-browser.js';

const EPHE_FILES = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1']; // planets, Moon, asteroids (Chiron, Juno), years 1800-2400
let pending = null;

export function loadSwiss() {
  if (!pending) {
    pending = (async function () {
      const swe = new SwissEphemeris();
      await swe.init(new URL('./swisseph.wasm', import.meta.url).href);
      await swe.loadEphemerisFiles(EPHE_FILES.map(function (name) {
        return { name: name, url: new URL('../../ephe/' + name, import.meta.url).href };
      }));
      return swe;
    }());
    pending.catch(function () { pending = null; }); // let the visitor try again after a failed download
  }
  return pending;
}
