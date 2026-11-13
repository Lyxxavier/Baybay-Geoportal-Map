(function () {
  "use strict";

  var DATA_URL = "data/reclamation-projects.geojson";
  var CENTER = [14.56, 120.95]; // Manila Bay
  var COLORS = { Planned: "#4d78a8", Ongoing: "#d38a00", Completed: "#2e7d5b" };

  // Used only if the GeoJSON file can't be loaded (e.g. opening index.html straight from disk).
  var FALLBACK = {
    type: "FeatureCollection",
    features: [
      feature("Manila Waterfront Area (placeholder)", "Completed", 12.5, "Placeholder agency", 2019,
        [[120.9600, 14.5880], [120.9680, 14.5880], [120.9680, 14.5800], [120.9600, 14.5800]]),
      feature("Pasay Offshore Area (placeholder)", "Ongoing", 65.0, "Placeholder agency", 2024,
        [[120.9620, 14.5380], [120.9780, 14.5390], [120.9770, 14.5240], [120.9610, 14.5230]]),
      feature("Cavite Coastal Area (placeholder)", "Planned", 30.0, "Placeholder agency", 2028,
        [[120.9050, 14.4900], [120.9200, 14.4900], [120.9200, 14.4780], [120.9050, 14.4780]])
    ]
  };

  function feature(name, status, area, agency, year, ring) {
    ring = ring.concat([ring[0]]);
    return {
      type: "Feature",
      properties: { name: name, status: status, area_ha: area, agency: agency, year: year },
      geometry: { type: "Polygon", coordinates: [ring] }
    };
  }

  var map = L.map("map", { zoomControl: true }).setView(CENTER, 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  var layerGroup = L.layerGroup().addTo(map);
  var features = [];
  var layersById = {};
  var activeStatuses = { Planned: true, Ongoing: true, Completed: true };

  var listEl = document.getElementById("project-list");
  var emptyEl = document.getElementById("empty");
  var noteEl = document.getElementById("data-note");
  var searchEl = document.getElementById("project-search");
  var resultSummaryEl = document.getElementById("result-summary");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function styleFor(status) {
    var c = COLORS[status] || "#476069";
    return { color: c, weight: 2, fillColor: c, fillOpacity: 0.35 };
  }

  function popupHtml(p) {
    return '<div class="popup"><h3>' + esc(p.name) + "</h3>" +
      "<p>" + esc(p.status) + (p.year ? ", " + esc(p.year) : "") + "</p>" +
      "<p>" + esc(p.area_ha) + " ha</p>" +
      (p.agency ? "<p>" + esc(p.agency) + "</p>" : "") + "</div>";
  }

  function visible() {
    var query = searchEl.value.trim().toLowerCase();
    return features.filter(function (f) {
      var p = f.properties || {};
      var matchesStatus = activeStatuses[p.status];
      var searchable = [p.name, p.status, p.agency].join(" ").toLowerCase();
      return matchesStatus && (!query || searchable.indexOf(query) !== -1);
    });
  }

  function render() {
    var shown = visible();
    layerGroup.clearLayers();
    listEl.innerHTML = "";

    shown.forEach(function (f) {
      var id = f._id;
      var layer = layersById[id];
      layerGroup.addLayer(layer);

      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.style.setProperty("--c", COLORS[f.properties.status] || "");
      btn.innerHTML = '<span class="name">' + esc(f.properties.name) + "</span>" +
        '<span class="meta">' + esc(f.properties.status) + ", " + esc(f.properties.area_ha) + " ha</span>";
      btn.addEventListener("click", function () { focusProject(id, btn); });
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    emptyEl.hidden = shown.length > 0;
    resultSummaryEl.textContent = "Showing " + shown.length + " of " + features.length + " projects";
    updateStats(shown);
  }

  function focusProject(id, btn) {
    var layer = layersById[id];
    map.fitBounds(layer.getBounds(), { maxZoom: 17, padding: [40, 40] });
    layer.openPopup();
    Array.prototype.forEach.call(listEl.querySelectorAll("button"), function (b) {
      b.removeAttribute("aria-current");
    });
    if (btn) btn.setAttribute("aria-current", "true");
  }

  function updateStats(shown) {
    var area = shown.reduce(function (sum, f) { return sum + (Number(f.properties.area_ha) || 0); }, 0);
    var done = shown.filter(function (f) { return f.properties.status === "Completed"; }).length;
    document.getElementById("stat-count").textContent = shown.length;
    document.getElementById("stat-area").textContent = area.toFixed(1);
    document.getElementById("stat-done").textContent = done;
  }

  function load(data, isFallback) {
    features = data.features || [];
    features.forEach(function (f, i) {
      f._id = i;
      var layer = L.geoJSON(f, { style: styleFor(f.properties.status) });
      layer.bindPopup(popupHtml(f.properties));
      layer.on("click", function () {
        var btns = listEl.querySelectorAll("button");
        var pos = visible().indexOf(f);
        focusProject(f._id, btns[pos]);
      });
      layersById[i] = layer;
    });

    render();
    if (features.length) map.fitBounds(L.featureGroup(Object.values(layersById)).getBounds(), { padding: [40, 40] });

    if (isFallback) {
      noteEl.textContent = "Showing built-in sample projects. The GeoJSON file could not be loaded. If you opened this page from a folder, run a local server (for example, python -m http.server).";
      noteEl.hidden = false;
    }
  }

  document.querySelectorAll(".filters input").forEach(function (input) {
    input.addEventListener("change", function () {
      activeStatuses[input.value] = input.checked;
      render();
    });
  });

  searchEl.addEventListener("input", render);

  document.getElementById("reset-filters").addEventListener("click", function () {
    searchEl.value = "";
    document.querySelectorAll(".filters input").forEach(function (input) {
      input.checked = true;
      activeStatuses[input.value] = true;
    });
    render();
    searchEl.focus();
  });

  function activateTab(button) {
    var target = button.getAttribute("data-tab");
    document.querySelectorAll(".tab-button").forEach(function (tab) {
      var selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      var active = panel.id === target || panel.getAttribute("data-tab") === target;
      panel.classList.toggle("active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
    });
    if (target === "projects") window.setTimeout(function () { map.invalidateSize(); }, 0);
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab-button"));
  tabs.forEach(function (button) {
    button.addEventListener("click", function () { activateTab(button); });
    button.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(button);
      var nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[nextIndex].focus();
      activateTab(tabs[nextIndex]);
    });
  });

  document.getElementById("reportForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!form.reportValidity()) return;

    var preview = document.getElementById("reportPreview");
    var values = new FormData(form);
    var fields = [
      ["Issue type", values.get("issueType")],
      ["Location", values.get("location") || "Not provided"],
      ["Incident details", values.get("details") || "Not provided"],
      ["Evidence", values.get("evidence") || "Not provided"]
    ];
    var heading = document.createElement("h3");
    heading.textContent = "Report preview — not submitted";
    var list = document.createElement("dl");
    fields.forEach(function (field) {
      var term = document.createElement("dt");
      var description = document.createElement("dd");
      term.textContent = field[0];
      description.textContent = field[1];
      list.appendChild(term);
      list.appendChild(description);
    });
    preview.replaceChildren(heading, list);
    preview.hidden = false;
    preview.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) { load(data, false); })
    .catch(function () { load(FALLBACK, true); });
})();
