(function () {
  "use strict";

  var DATA_URL = "data/reclamation-projects.geojson";
  var MAX_VISIBLE_PROJECTS = 6;
  var CENTER = [14.56, 120.95]; // Manila Bay
  var COLORS = { Planned: "#4d78a8", Ongoing: "#d38a00", Completed: "#2e7d5b" };

  // Source-based project records used if the optional GeoJSON file cannot be loaded.
  var FALLBACK = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Pasay Reclamation and Development Project",
          status: "Ongoing",
          area_ha: 360,
          agency: "Pasay City Government and SM Prime Holdings Inc.",
          milestone: "Reclamation milestone: as of 31 December 2025, PRA reported 360 ha reclaimed above 1.5 m MLLW and ready for horizontal construction such as roads and bridges. PRA also reported requesting Survey Authority for Phase 5 (71.43 ha) on 18 December 2025.",
          source_url: "https://www.pea.gov.ph/360-hectare-pasay-reclamation-and-development-project/"
        },
        geometry: null
      },
      {
        type: "Feature",
        properties: {
          name: "Pasay Harbor City Reclamation Project",
          status: "Ongoing",
          area_ha: 265,
          agency: "Pasay City Government and Pasay Harbor City Corporation",
          milestone: "As of 31 December 2025, PRA reported 129.23 ha of Island A remained below water. Reclamation resumed after suspension was lifted in November 2025; work was expected to continue through 2026, with total completion expected by August 2028.",
          source_url: "https://www.pea.gov.ph/265-hectare-pasay-harbor-city-reclamation-project/"
        },
        geometry: null
      },
      {
        type: "Feature",
        properties: {
          name: "Illustrative placeholder — Planned example",
          status: "Planned",
          agency: "Illustrative placeholder; not an actual project",
          is_placeholder: true,
          milestone: "Sample feature and shape for demonstrating the portal only. This is not a real project or verified location."
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[120.9050, 14.4900], [120.9200, 14.4900], [120.9200, 14.4780], [120.9050, 14.4780], [120.9050, 14.4900]]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Illustrative placeholder — Ongoing example",
          status: "Ongoing",
          agency: "Illustrative placeholder; not an actual project",
          is_placeholder: true,
          milestone: "Sample feature and shape for demonstrating the portal only. This is not a real project or verified location."
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[120.9620, 14.5380], [120.9780, 14.5390], [120.9770, 14.5240], [120.9610, 14.5230], [120.9620, 14.5380]]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Illustrative placeholder — Completed example",
          status: "Completed",
          agency: "Illustrative placeholder; not an actual project",
          is_placeholder: true,
          milestone: "Sample feature and shape for demonstrating the portal only. This is not a real project or verified location."
        },
        geometry: {
          type: "Polygon",
          coordinates: [[[120.9600, 14.5880], [120.9680, 14.5880], [120.9680, 14.5800], [120.9600, 14.5800], [120.9600, 14.5880]]]
        }
      }
    ]
  };

  var map = L.map("map", { zoomControl: true }).setView(CENTER, 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  map.on("popupopen", function (event) {
    window.requestAnimationFrame(function () {
      var mapTop = map.getContainer().getBoundingClientRect().top;
      var popupTop = event.popup.getElement().getBoundingClientRect().top;
      var topGap = 12;
      if (popupTop < mapTop + topGap) {
        map.panBy([0, -(mapTop + topGap - popupTop)], { animate: false });
      }
    });
  });

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

  function styleFor(status, isPlaceholder) {
    var c = COLORS[status] || "#476069";
    return {
      color: c,
      weight: 2,
      dashArray: isPlaceholder ? "6 5" : null,
      fillColor: c,
      fillOpacity: isPlaceholder ? 0.16 : 0.35
    };
  }

  function popupHtml(p) {
    return '<div class="popup"><h3>' + esc(p.name) + "</h3>" +
      "<p>" + esc(p.status) + (p.year ? ", " + esc(p.year) : "") + "</p>" +
      (p.area_ha != null ? "<p>" + esc(p.area_ha) + " ha project area</p>" : "") +
      (p.is_placeholder ? "<p><strong>Illustrative placeholder — not a real project or boundary.</strong></p>" : "") +
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
    var matches = visible();
    var listed = matches.slice(0, MAX_VISIBLE_PROJECTS);
    layerGroup.clearLayers();
    listEl.innerHTML = "";

    matches.forEach(function (f) {
      var layer = layersById[f._id];
      if (layer) layerGroup.addLayer(layer);
    });

    listed.forEach(function (f) {
      var id = f._id;
      var li = document.createElement("li");
      var p = f.properties || {};

      if (f.geometry) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.style.setProperty("--c", COLORS[p.status] || "");
        btn.innerHTML = '<span class="name">' + esc(p.name) + "</span>" +
          '<span class="meta">' + esc(p.status) +
          (p.area_ha != null ? " · " + esc(p.area_ha) + " ha project area" : "") + "</span>" +
          (p.is_placeholder ? '<span class="placeholder-tag">Illustrative sample — not a real project</span>' : "");
        btn.addEventListener("click", function () { focusProject(id, btn); });
        li.appendChild(btn);
      } else {
        var record = document.createElement("article");
        record.className = "project-record";
        record.style.setProperty("--c", COLORS[p.status] || "");
        record.innerHTML = '<h2 class="name">' + esc(p.name) + "</h2>" +
          '<p class="meta">' + esc(p.status) + " · " + esc(p.area_ha) + " ha project area</p>" +
          '<details class="record-details"><summary>Project details and source</summary>' +
          (p.agency ? '<p class="record-detail"><strong>Proponents:</strong> ' + esc(p.agency) + "</p>" : "") +
          (p.milestone ? '<p class="record-detail">' + esc(p.milestone) + "</p>" : "") +
          (p.source_url ? '<a class="record-source" href="' + esc(p.source_url) + '" target="_blank" rel="noopener noreferrer">Read PRA source<span class="sr-only"> (opens in a new tab)</span></a>' : "") +
          "</details>";
        li.appendChild(record);
      }
      listEl.appendChild(li);
    });

    emptyEl.hidden = matches.length > 0;
    resultSummaryEl.textContent = "Showing " + listed.length + " of " + matches.length +
      " matching projects" + (matches.length > MAX_VISIBLE_PROJECTS ? " — search to find others." : ".");
    updateStats(matches);
  }

  function focusProject(id, btn) {
    var layer = layersById[id];
    if (!layer) return;
    map.fitBounds(layer.getBounds(), { maxZoom: 17, padding: [40, 40] });
    layer.openPopup();
    Array.prototype.forEach.call(listEl.querySelectorAll("button"), function (b) {
      b.removeAttribute("aria-current");
    });
    if (btn) btn.setAttribute("aria-current", "true");
  }

  function updateStats(shown) {
    var officialRecords = shown.filter(function (f) { return !f.properties.is_placeholder; });
    var area = officialRecords.reduce(function (sum, f) { return sum + (Number(f.properties.area_ha) || 0); }, 0);
    var mapped = officialRecords.filter(function (f) { return Boolean(f.geometry); }).length;
    document.getElementById("stat-count").textContent = shown.length;
    document.getElementById("stat-area").textContent = area.toFixed(1);
    document.getElementById("stat-done").textContent = mapped;
  }

  function load(data, isFallback) {
    features = data.features || [];
    features.forEach(function (f, i) {
      f._id = i;
      if (f.geometry) {
        var layer = L.geoJSON(f, { style: styleFor(f.properties.status, f.properties.is_placeholder) });
        layer.bindPopup(popupHtml(f.properties), {
          maxWidth: 240,
          minWidth: 0,
          autoPan: true,
          autoPanPaddingTopLeft: [20, 32],
          autoPanPaddingBottomRight: [20, 20]
        });
        layer.on("click", function () {
          var btns = listEl.querySelectorAll("button");
          var pos = visible().indexOf(f);
          focusProject(f._id, pos < MAX_VISIBLE_PROJECTS ? btns[pos] : null);
        });
        layersById[i] = layer;
      }
    });

    render();
    var mappedLayers = Object.keys(layersById).map(function (id) { return layersById[id]; });
    if (mappedLayers.length) {
      map.fitBounds(L.featureGroup(mappedLayers).getBounds(), { padding: [40, 40] });
    }

    var hasPlaceholders = features.some(function (f) { return f.properties && f.properties.is_placeholder; });
    var hasUnmappedRecords = features.some(function (f) { return !f.geometry; });
    if (isFallback) {
      noteEl.textContent = "Showing built-in sample projects. The GeoJSON file could not be loaded. If you opened this page from a folder, run a local server (for example, python -m http.server).";
      noteEl.hidden = false;
    } else if (hasPlaceholders) {
      noteEl.textContent = "Illustrative placeholders shown; PRA boundaries are unavailable.";
      noteEl.hidden = false;
    } else if (hasUnmappedRecords) {
      noteEl.textContent = "Some project records have no verified boundaries and are not drawn.";
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
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
