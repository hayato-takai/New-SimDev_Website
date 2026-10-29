// Pressure thrust of connection ports: F = p · A, with A = π d² / 4.
//
// Each row is a port with a diameter and a pressure. Values are stored in SI
// (m, Pa) and converted for display, so switching units never changes a
// result. Rows can be added, deleted and reordered by their drag handle, and
// the table exported as CSV named after the calculation.
(function () {
  const LENGTH_TO_M = { mm: 0.001, in: 0.0254 };
  const PRESSURE_TO_PA = { bar: 100000, psi: 6894.757293168, MPa: 1000000 };
  const FORCE_FROM_N = { N: 1, lbf: 1 / 4.4482216152605 };

  const state = {
    units: { length: "mm", pressure: "bar", force: "N" },
    rows: [
      { id: cryptoId(), name: "Port A", diameterM: 0.05, pressurePa: 10 * PRESSURE_TO_PA.bar }
    ]
  };

  function cryptoId() {
    return "r" + Math.random().toString(36).slice(2, 10);
  }

  const tableBody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  const nameInput = document.getElementById("ptCalcName");
  const diameterHeader = document.getElementById("diameterHeader");
  const areaHeader = document.getElementById("areaHeader");
  const pressureHeader = document.getElementById("pressureHeader");
  const thrustHeader = document.getElementById("thrustHeader");

  function formatNumber(n) {
    if (!isFinite(n)) return "";
    const abs = Math.abs(n);
    const decimals = abs !== 0 && abs < 1 ? 4 : abs < 100 ? 3 : 2;
    return parseFloat(n.toFixed(decimals)).toString();
  }

  function areaUnitLabel() {
    return state.units.length === "mm" ? "mm²" : "in²";
  }

  function updateHeaders() {
    diameterHeader.textContent = `Diameter (${state.units.length})`;
    areaHeader.textContent = `Area (${areaUnitLabel()})`;
    pressureHeader.textContent = `Pressure (${state.units.pressure})`;
    thrustHeader.textContent = `Pressure Thrust (${state.units.force})`;
  }

  function diameterDisplayValue(row) {
    const factor = LENGTH_TO_M[state.units.length];
    return row.diameterM / factor;
  }

  function pressureDisplayValue(row) {
    const factor = PRESSURE_TO_PA[state.units.pressure];
    return row.pressurePa / factor;
  }

  function computeAreaDisplay(row) {
    const lengthFactor = LENGTH_TO_M[state.units.length];
    const radiusM = row.diameterM / 2;
    const areaM2 = Math.PI * radiusM * radiusM;
    return areaM2 / (lengthFactor * lengthFactor);
  }

  function computeThrustDisplay(row) {
    const radiusM = row.diameterM / 2;
    const areaM2 = Math.PI * radiusM * radiusM;
    const forceN = areaM2 * row.pressurePa;
    return forceN * FORCE_FROM_N[state.units.force];
  }

  function render() {
    updateHeaders();
    tableBody.innerHTML = "";
    emptyState.hidden = state.rows.length > 0;

    state.rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.dataset.rowId = row.id;

      const dragTd = document.createElement("td");
      dragTd.className = "col-drag";
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.title = "Drag to reorder";
      dragHandle.addEventListener("mousedown", (e) => startRowDrag(e, row.id));
      dragTd.appendChild(dragHandle);
      tr.appendChild(dragTd);

      const nameTd = document.createElement("td");
      const portName = document.createElement("input");
      portName.type = "text";
      portName.className = "cell-input name-input";
      portName.placeholder = "Port name";
      portName.setAttribute("aria-label", "Port name");
      portName.value = row.name;
      portName.addEventListener("input", (e) => {
        row.name = e.target.value;
      });
      nameTd.appendChild(portName);
      tr.appendChild(nameTd);

      const diaTd = document.createElement("td");
      diaTd.className = "num";
      const diaInput = document.createElement("input");
      diaInput.type = "number";
      diaInput.step = "any";
      diaInput.min = "0";
      diaInput.className = "cell-input";
      diaInput.placeholder = "0";
      diaInput.setAttribute("aria-label", "Diameter");
      diaInput.value = row.diameterM ? formatEditable(diameterDisplayValue(row)) : "";
      diaInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        row.diameterM = isFinite(val) ? val * LENGTH_TO_M[state.units.length] : 0;
        updateComputedCells(tr, row);
      });
      diaTd.appendChild(diaInput);
      tr.appendChild(diaTd);

      const areaTd = document.createElement("td");
      areaTd.className = "num computed area-cell";
      areaTd.textContent = row.diameterM ? formatNumber(computeAreaDisplay(row)) : "—";
      tr.appendChild(areaTd);

      const presTd = document.createElement("td");
      presTd.className = "num";
      const presInput = document.createElement("input");
      presInput.type = "number";
      presInput.step = "any";
      presInput.className = "cell-input";
      presInput.placeholder = "0";
      presInput.setAttribute("aria-label", "Pressure");
      presInput.value = row.pressurePa ? formatEditable(pressureDisplayValue(row)) : "";
      presInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        row.pressurePa = isFinite(val) ? val * PRESSURE_TO_PA[state.units.pressure] : 0;
        updateComputedCells(tr, row);
      });
      presTd.appendChild(presInput);
      tr.appendChild(presTd);

      const thrustTd = document.createElement("td");
      thrustTd.className = "num computed thrust-cell";
      thrustTd.textContent = (row.diameterM && row.pressurePa) ? formatNumber(computeThrustDisplay(row)) : "—";
      tr.appendChild(thrustTd);

      const actionTd = document.createElement("td");
      actionTd.className = "col-actions";
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "row-delete";
      delBtn.textContent = "×";
      delBtn.title = "Delete row";
      delBtn.setAttribute("aria-label", "Delete row");
      delBtn.addEventListener("click", () => {
        state.rows = state.rows.filter((r) => r.id !== row.id);
        render();
      });
      actionTd.appendChild(delBtn);
      tr.appendChild(actionTd);

      tableBody.appendChild(tr);
    });
  }

  function startRowDrag(e, rowId) {
    e.preventDefault();
    document.body.style.userSelect = "none";
    document.body.classList.add("row-dragging");

    let overId = null;
    let overPosition = null;

    const sourceTr = tableBody.querySelector(`tr[data-row-id="${rowId}"]`);
    if (sourceTr) sourceTr.classList.add("dragging");

    function clearIndicators() {
      tableBody.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach((el) => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
      });
    }

    function onMouseMove(ev) {
      const rows = Array.from(tableBody.querySelectorAll("tr"));
      clearIndicators();
      overId = null;
      overPosition = null;
      for (const r of rows) {
        if (r.dataset.rowId === rowId) continue;
        const rect = r.getBoundingClientRect();
        if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          const isAfter = (ev.clientY - rect.top) > rect.height / 2;
          r.classList.add(isAfter ? "drag-over-bottom" : "drag-over-top");
          overId = r.dataset.rowId;
          overPosition = isAfter ? "after" : "before";
          break;
        }
      }
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
      document.body.classList.remove("row-dragging");
      clearIndicators();
      if (sourceTr) sourceTr.classList.remove("dragging");

      if (overId && overId !== rowId) {
        const fromIndex = state.rows.findIndex((r) => r.id === rowId);
        if (fromIndex !== -1) {
          const [moved] = state.rows.splice(fromIndex, 1);
          let toIndex = state.rows.findIndex((r) => r.id === overId);
          if (toIndex === -1) toIndex = state.rows.length;
          if (overPosition === "after") toIndex += 1;
          state.rows.splice(toIndex, 0, moved);
          render();
        }
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function formatEditable(n) {
    if (!isFinite(n)) return "";
    return parseFloat(n.toFixed(6)).toString();
  }

  function updateComputedCells(tr, row) {
    const areaCell = tr.querySelector(".area-cell");
    const thrustCell = tr.querySelector(".thrust-cell");
    areaCell.textContent = row.diameterM ? formatNumber(computeAreaDisplay(row)) : "—";
    thrustCell.textContent = (row.diameterM && row.pressurePa) ? formatNumber(computeThrustDisplay(row)) : "—";
  }

  function addRow() {
    state.rows.push({ id: cryptoId(), name: "", diameterM: 0, pressurePa: 0 });
    render();
    const inputs = tableBody.querySelectorAll("tr:last-child input");
    if (inputs.length) inputs[0].focus();
  }

  document.getElementById("addRowBtnTop").addEventListener("click", addRow);
  document.getElementById("addRowBtnBottom").addEventListener("click", addRow);

  // Unit switches: one active button per group, mirrored in aria-pressed.
  document.querySelectorAll(".pt-tool .segmented").forEach((group) => {
    const key = group.dataset.group;
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      group.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      state.units[key] = btn.dataset.value;
      render();
    });
  });

  function sanitizeFilename(name) {
    const cleaned = name.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
    return cleaned || "Untitled";
  }

  function exportCsv() {
    const rows = [
      [
        "Name",
        `Diameter (${state.units.length})`,
        `Area (${areaUnitLabel()})`,
        `Pressure (${state.units.pressure})`,
        `Pressure Thrust (${state.units.force})`
      ]
    ];

    state.rows.forEach((row) => {
      rows.push([
        row.name || "",
        row.diameterM ? formatEditable(diameterDisplayValue(row)) : "",
        row.diameterM ? formatEditable(computeAreaDisplay(row)) : "",
        row.pressurePa ? formatEditable(pressureDisplayValue(row)) : "",
        (row.diameterM && row.pressurePa) ? formatEditable(computeThrustDisplay(row)) : ""
      ]);
    });

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${sanitizeFilename(nameInput.value)}_pressure_thrust_calculation_output.csv`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("exportBtn").addEventListener("click", exportCsv);

  render();
})();
