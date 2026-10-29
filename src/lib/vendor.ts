/**
 * Third-party browser libraries served from this site instead of a CDN, so
 * no visitor request goes to another server and the code is the exact
 * version locked in package-lock.json.
 *
 * Chart.js's browser build (it defines the global `Chart` the tool scripts
 * use). The package's exports don't list dist/, so it is reached by path;
 * `?url` makes Vite copy it into the build and return its address.
 */
export { default as chartJsUrl } from '../../node_modules/chart.js/dist/chart.umd.min.js?url';
