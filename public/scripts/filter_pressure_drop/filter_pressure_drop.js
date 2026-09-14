/* Filter element pressure drop.
 *
 * Model, ported from the filter ML prototype (test.html):
 *
 *   ΔP_total(Q) = AX2/1000 · Q² + BX/100 · Q   +   S(ν) · Q
 *                 └──────── housing ────────┘       └ element ┘
 *
 * S(ν) is the element's ΔP/Q taken from its dp-Q test points, linearly
 * interpolated in viscosity and held at the end values outside them.
 * Q in L/min, ν in mm²/s, ΔP in bar.
 *
 * Selection: in each series only the smallest size whose maximum flow rate
 * covers the operating flow is kept; every element of that size is compared.
 */
(function () {
  "use strict";

  const EMPTY = "---";
  const PALETTE = [
    "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777",
    "#65a30d", "#4f46e5", "#0d9488", "#b45309", "#9333ea", "#475569",
  ];

  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

  // ── Data ──────────────────────────────────────────────────
  /** Filter_data.json -> [{ key, name, sizes: [{ name, maxFlow, elements }] }] */
  function normalise(json) {
    const series = (json && json.data && json.data.Series) || {};
    return Object.entries(series).map(([key, s]) => ({
      key,
      name: key.trim(),
      sizes: Object.entries((s && s.filters) || {})
        .map(([sizeName, size]) => ({
          name: sizeName.trim(),
          maxFlow: Number(size.maximum_flow_rate),
          elements: Object.entries(size.element || {}).map(([elName, el]) => ({
            name: elName.trim(),
            area: Number(el["area [cm^2]"]),
            link: el.link || "",
            AX2: Number(el.AX2) || 0,
            BX: Number(el.BX) || 0,
            points: (el.data || [])
              .map((d) => ({
                viscosity: Number(d.viscosity),
                flow: Number(d.flow),
                pressure: Number(d.pressure),
              }))
              .filter((d) => d.viscosity > 0 && d.flow > 0 && Number.isFinite(d.pressure))
              .sort((a, b) => a.viscosity - b.viscosity),
          })),
        }))
        .filter((size) => Number.isFinite(size.maxFlow))
        .sort((a, b) => a.maxFlow - b.maxFlow),
    }));
  }

  // ── Model ─────────────────────────────────────────────────
  /** Element ΔP/Q at viscosity `visc`. `points` must be sorted by viscosity. */
  function elementSlope(points, visc) {
    const slope = (p) => p.pressure / p.flow;
    const first = points[0];
    const last = points[points.length - 1];

    if (visc <= first.viscosity) return { slope: slope(first), clamped: visc < first.viscosity };
    if (visc >= last.viscosity) return { slope: slope(last), clamped: visc > last.viscosity };

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (visc <= b.viscosity) {
        const t = b.viscosity === a.viscosity ? 0 : (visc - a.viscosity) / (b.viscosity - a.viscosity);
        return { slope: slope(a) + (slope(b) - slope(a)) * t, clamped: false };
      }
    }
    return { slope: slope(last), clamped: false };
  }

  const housingDp = (el, q) => (el.AX2 / 1000) * q * q + (el.BX / 100) * q;

  function evaluate(series, { flow, visc, maxDp, enabled }) {
    const limit = Number.isFinite(maxDp) && maxDp > 0 ? maxDp : null;
    const matches = [];
    const eliminated = [];
    let clamped = false;

    for (const s of series) {
      if (enabled && !enabled.has(s.key)) {
        eliminated.push({ filter: s.name, element: "", reason: "Series switched off" });
        continue;
      }

      const kept = s.sizes.find((size) => size.maxFlow >= flow);
      if (!kept) {
        const largest = s.sizes[s.sizes.length - 1];
        eliminated.push({
          filter: s.name,
          element: "",
          reason: largest
            ? `Operating flow is above the largest size, ${largest.name} (${fmtInt(largest.maxFlow)} L/min)`
            : "No sizes in the data",
        });
        continue;
      }

      for (const size of s.sizes) {
        if (size === kept) continue;
        eliminated.push({
          filter: size.name,
          element: "",
          reason: size.maxFlow < flow
            ? `Max flow ${fmtInt(size.maxFlow)} L/min is below the operating flow`
            : `Larger than needed; ${kept.name} is the smallest that fits`,
        });
      }

      const group = [];
      for (const el of kept.elements) {
        if (!el.points.length) {
          eliminated.push({ filter: kept.name, element: el.name, reason: "No dp-Q test data" });
          continue;
        }
        const fit = elementSlope(el.points, visc);
        const housing = housingDp(el, flow);
        const element = fit.slope * flow;
        const total = housing + element;

        if (limit !== null && total > limit) {
          eliminated.push({
            filter: kept.name,
            element: el.name,
            reason: `ΔP ${total.toFixed(3)} bar exceeds the ${limit} bar limit`,
          });
          continue;
        }
        if (fit.clamped) clamped = true;
        group.push({ series: s, size: kept, el, slope: fit.slope, housing, element, total });
      }
      group.sort((a, b) => a.total - b.total);
      matches.push(...group);
    }

    return { matches, eliminated, clamped };
  }

  // ── Page ──────────────────────────────────────────────────
  function init() {
    const $ = (id) => document.getElementById(id);
    const ui = {
      flow: $("fpdFlow"),
      visc: $("fpdVisc"),
      maxDp: $("fpdMaxDp"),
      fluid: $("fpdFluid"),
      temp: $("fpdTemp"),
      series: $("fpdSeries"),
      count: $("fpdCount"),
      best: $("fpdBest"),
      bestElement: $("fpdBestElement"),
      bestSize: $("fpdBestSize"),
      note: $("fpdNote"),
      canvas: $("fpdChart"),
      placeholder: $("fpdPlaceholder"),
      matchBody: $("fpdMatchBody"),
      elimBody: $("fpdElimBody"),
      elimCount: $("fpdElimCount"),
    };
    if (!ui.flow) return;

    let series = [];
    let chart = null;

    const num = (input) => {
      const v = parseFloat(input.value);
      return Number.isFinite(v) ? v : NaN;
    };
    const esc = (text) =>
      String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const emptyRow = (cols, text) => `<tr><td class="fpd-empty" colspan="${cols}">${esc(text)}</td></tr>`;

    function enabledSeries() {
      return new Set(
        [...ui.series.querySelectorAll("input[type=checkbox]")]
          .filter((cb) => cb.checked)
          .map((cb) => cb.value)
      );
    }

    function buildSeriesToggles() {
      ui.series.innerHTML = series
        .map((s) => `
          <label class="fpd-series-item">
            <span class="toggle">
              <input type="checkbox" value="${esc(s.key)}" checked />
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </span>
            <span class="fpd-series-name">${esc(s.name)}</span>
            <span class="fpd-series-meta">${s.sizes.length} sizes</span>
          </label>`)
        .join("");
    }

    function showPlaceholder(text) {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      ui.placeholder.querySelector("span").textContent = text;
      ui.placeholder.hidden = false;
    }

    function clearOutputs(message) {
      ui.count.textContent = EMPTY;
      ui.best.textContent = EMPTY;
      ui.bestElement.textContent = EMPTY;
      ui.bestSize.textContent = "";
      ui.note.hidden = true;
      showPlaceholder(message);
      ui.matchBody.innerHTML = emptyRow(7, message);
      ui.elimBody.innerHTML = emptyRow(3, message);
      ui.elimCount.textContent = "";
    }

    function renderSummary({ matches, clamped }) {
      ui.count.textContent = String(matches.length);
      ui.note.hidden = !clamped;
      if (!matches.length) {
        ui.best.textContent = EMPTY;
        ui.bestElement.textContent = EMPTY;
        ui.bestSize.textContent = "";
        return;
      }
      const best = matches.reduce((a, b) => (b.total < a.total ? b : a));
      ui.best.textContent = best.total.toFixed(3);
      ui.bestElement.textContent = best.el.name;
      ui.bestSize.textContent = best.size.name;
    }

    function renderChart({ matches }, flow, maxDp) {
      if (typeof Chart === "undefined") {
        showPlaceholder("Chart library failed to load");
        return;
      }
      if (!matches.length) {
        showPlaceholder("No elements match the current inputs");
        return;
      }
      if (chart) chart.destroy();
      ui.placeholder.hidden = true;

      const limit = maxDp > 0 ? maxDp : null;
      const xMax = Math.max(...matches.map((m) => m.size.maxFlow)) * 1.15;
      const STEPS = 24;
      const curve = (m, from, to) =>
        Array.from({ length: STEPS + 1 }, (_, i) => {
          const q = from + ((to - from) * i) / STEPS;
          return { x: q, y: housingDp(m.el, q) + m.slope * q };
        });

      const datasets = [];
      for (const m of matches) {
        const label = `${m.size.name} · ${m.el.name}`;
        // Solid up to the size's rated flow, dotted past it.
        datasets.push({
          label,
          data: curve(m, 0, m.size.maxFlow),
          borderColor: m.color,
          backgroundColor: m.color,
          borderWidth: 2,
          pointRadius: 0,
        });
        datasets.push({
          label: `${label} (above rated flow)`,
          data: curve(m, m.size.maxFlow, xMax),
          borderColor: m.color,
          backgroundColor: m.color,
          borderWidth: 1.5,
          borderDash: [2, 3],
          pointRadius: 0,
          hideInLegend: true,
        });
      }

      const yTop = Math.max(limit || 0, ...datasets.flatMap((d) => d.data.map((p) => p.y)));
      datasets.push({
        label: "Operating flow",
        data: [{ x: flow, y: 0 }, { x: flow, y: yTop }],
        borderColor: "#6e6e73",
        backgroundColor: "#6e6e73",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        isMarker: true,
      });
      if (limit !== null) {
        datasets.push({
          label: "Max ΔP",
          data: [{ x: 0, y: limit }, { x: xMax, y: limit }],
          borderColor: "#c60000",
          backgroundColor: "#c60000",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          isMarker: true,
        });
      }

      const font = { family: getComputedStyle(ui.canvas).fontFamily, size: 13 };
      const grid = { color: "rgba(0,0,0,0.07)" };

      chart = new Chart(ui.canvas, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: "nearest", intersect: false },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font,
                boxWidth: 14,
                boxHeight: 2,
                filter: (item, data) => !data.datasets[item.datasetIndex].hideInLegend,
              },
            },
            tooltip: {
              titleFont: font,
              bodyFont: font,
              filter: (item) => !item.dataset.isMarker,
              callbacks: {
                title: (items) => (items.length ? `${items[0].parsed.x.toFixed(0)} L/min` : ""),
                label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(3)} bar`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: 0,
              bounds: "ticks",
              title: { display: true, text: "Flow rate Q (L/min)", font },
              ticks: { font },
              grid,
            },
            y: {
              beginAtZero: true,
              bounds: "ticks",
              title: { display: true, text: "Pressure drop ΔP (bar)", font },
              ticks: { font },
              grid,
            },
          },
        },
      });
    }

    function renderMatches({ matches }) {
      if (!matches.length) {
        ui.matchBody.innerHTML = emptyRow(7, "No elements match. Raise the max ΔP or switch more series on.");
        return;
      }
      const best = Math.min(...matches.map((m) => m.total));

      // One group per kept size; matches are already ordered size by size.
      const groups = [];
      for (const m of matches) {
        const last = groups[groups.length - 1];
        if (last && last.size === m.size) last.rows.push(m);
        else groups.push({ size: m.size, rows: [m] });
      }

      ui.matchBody.innerHTML = groups
        .map(({ size, rows }) =>
          rows
            .map((m, i) => {
              const head = i === 0
                ? `<th scope="rowgroup" rowspan="${rows.length}">${esc(size.name)}</th>
                   <td class="num" rowspan="${rows.length}">${fmtInt(size.maxFlow)}</td>`
                : "";
              const title = m.el.link ? ` title="${esc(`Datasheet: ${m.el.link}`)}"` : "";
              return `<tr${m.total === best ? ' class="is-best"' : ""}>
                ${head}
                <td><span class="fpd-swatch" style="background:${m.color}"></span><span${title}>${esc(m.el.name)}</span></td>
                <td class="num">${Number.isFinite(m.el.area) ? fmtInt(m.el.area) : EMPTY}</td>
                <td class="num">${m.housing.toFixed(3)}</td>
                <td class="num">${m.element.toFixed(3)}</td>
                <td class="num fpd-total">${m.total.toFixed(3)}</td>
              </tr>`;
            })
            .join("")
        )
        .join("");
    }

    function renderEliminated({ eliminated }) {
      ui.elimCount.textContent = eliminated.length ? `(${eliminated.length})` : "";
      ui.elimBody.innerHTML = eliminated.length
        ? eliminated
            .map((e) => `<tr>
              <th scope="row">${esc(e.filter)}</th>
              <td>${e.element ? esc(e.element) : EMPTY}</td>
              <td>${esc(e.reason)}</td>
            </tr>`)
            .join("")
        : emptyRow(3, "Nothing eliminated.");
    }

    function render() {
      if (!series.length) return;
      const flow = num(ui.flow);
      const visc = num(ui.visc);
      const maxDp = num(ui.maxDp);

      if (!(flow > 0) || !(visc > 0)) {
        clearOutputs("Enter a flow rate and a viscosity");
        return;
      }

      const result = evaluate(series, { flow, visc, maxDp, enabled: enabledSeries() });
      result.matches.forEach((m, i) => {
        m.color = PALETTE[i % PALETTE.length];
      });

      renderSummary(result);
      renderChart(result, flow, maxDp);
      renderMatches(result);
      renderEliminated(result);
    }

    // ── Fluid -> viscosity ──
    async function loadFluids() {
      if (!window.OilProps) {
        ui.fluid.disabled = true;
        return;
      }
      try {
        await OilProps.loadFluidData();
        for (const name of OilProps.getFluidNames()) ui.fluid.add(new Option(name, name));
      } catch (err) {
        console.error("Fluid data failed to load:", err);
        ui.fluid.disabled = true;
      }
    }

    function viscosityFromFluid() {
      const name = ui.fluid.value;
      const t = num(ui.temp);
      if (!name || !Number.isFinite(t) || !window.OilProps) return;
      const nu = OilProps.getKinViscAtTemp(name, t + 273.15);
      if (Number.isFinite(nu) && nu > 0) ui.visc.value = String(Number(nu.toPrecision(4)));
    }

    // ── Events ──
    ui.flow.addEventListener("input", render);
    ui.maxDp.addEventListener("input", render);
    ui.series.addEventListener("change", render);

    // A typed viscosity no longer corresponds to the fluid, so the selection
    // is cleared. Filling it from the fluid sets .value, which fires no event.
    ui.visc.addEventListener("input", () => {
      ui.fluid.value = "";
      render();
    });
    ui.fluid.addEventListener("change", () => {
      viscosityFromFluid();
      render();
    });
    ui.temp.addEventListener("input", () => {
      viscosityFromFluid();
      render();
    });

    document.querySelectorAll(".fpd-tool .table-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.getAttribute("aria-controls"));
        if (!target) return;
        const open = target.hidden;
        target.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
        button.textContent = open ? button.dataset.hide : button.dataset.show;
      });
    });

    // ── Load ──
    loadFluids();
    fetch(`${window.BASE_URL || ""}/components/Filter_data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        series = normalise(json);
        buildSeriesToggles();
        render();
      })
      .catch((err) => {
        console.error("Filter data failed to load:", err);
        ui.series.innerHTML = '<span class="hint">Filter data could not be loaded.</span>';
        clearOutputs("Filter data could not be loaded");
      });
  }

  const api = { normalise, elementSlope, housingDp, evaluate };

  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    window.FilterPressureDrop = api;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
