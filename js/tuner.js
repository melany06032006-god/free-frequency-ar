/* Sintonizador ilustrativo de la radio. Se monta sobre el bloque [data-tuner] del cuadro de la secuencia (js/sequence.js).
   El estado (encendida, banda, posición del dial) es único: lo leen tanto este control como la radio 3D, así la aguja y las perillas siguen lo que haces.
   No reproduce sonido ni usa frecuencias reales: muestra ruido visual, un medidor de claridad y un mensaje de ejemplo cuando el dial cae sobre una "emisora". */
window.FFTuner = (function () {
  "use strict";
  var state = { on: false, band: "AM", pos: 8 }, CAPTURE = 9, view = null;   // view: función que repinta el control montado
  /* audioCap (0–1): lo más claro que puede sonar. En la zona rural la emisora llega débil (antena recogida): aunque el dial esté justo en ella, solo
     se oye estática (js/seq-modules.js lo fija según la zona). La claridad del dial (clarity) no cambia: sirve para saber si encontró la emisora. */
  var api = null;

  function nearest(list, pos) {
    var best = null, bd = 1e9;
    list.forEach(function (s) { var d = Math.abs(s.pos - pos); if (d < bd) { bd = d; best = s; } });
    return { st: best, d: bd };
  }
  /* claridad de la señal (0–1) para el estado actual: la usan el medidor y la radio 3D */
  function clarity() {
    if (!state.on) return 0;
    return Math.max(0, 1 - nearest(window.FF.tuner.bands[state.band], state.pos).d / CAPTURE);
  }
  function kindAt() { var n = nearest(window.FF.tuner.bands[state.band], state.pos); return n.d <= CAPTURE ? n.st.kind : ""; }
  /* set(patch, user): con user = true (acción real del usuario) también suena: clic de perilla, dial, cambio de banda y estática de sintonía */
  function set(patch, user) {
    var b = { on: state.on, band: state.band, pos: state.pos }, bc = clarity();
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; }); if (view) view();
    var A = window.FFAudio; if (!user || !A) return; var c = clarity();
    if (patch.on !== undefined && patch.on !== b.on) A.click(state.on);
    if (patch.band !== undefined && patch.band !== b.band) A.band();
    if (patch.pos !== undefined && patch.pos !== b.pos && state.on) A.dial(state.pos);
    var cap = api && api.audioCap != null ? api.audioCap : 1;
    A.radio({ on: state.on, pos: state.pos, band: state.band, clarity: Math.min(c, cap), kind: kindAt() });
    if (cap >= 0.75 && state.on && bc < 0.75 && c >= 0.75 && kindAt() === "info") A.lock();
  }
  function reset() { set(window.FF.tuner.start); }

  function mount(root) {
    var box = root.querySelector("[data-tuner]"); if (!box) return;
    var D = window.FF.tuner;
    var power = box.querySelector(".tn-power"), range = box.querySelector(".tn-range"), needle = box.querySelector(".tn-needle"),
        meter = box.querySelector(".tn-meter i"), out = box.querySelector(".tn-out"), dial = box.querySelector(".tn-dial"),
        bandBtns = [].slice.call(box.querySelectorAll("[data-band]"));
    var lastMsg = "";

    function update() {
      var n = nearest(D.bands[state.band], state.pos), c = clarity(), msg;
      power.setAttribute("aria-checked", state.on ? "true" : "false");
      power.querySelector(".lbl").textContent = state.on ? "Apagar la radio" : "Encender la radio";
      bandBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-band") === state.band ? "true" : "false"); });
      range.disabled = !state.on; range.value = state.pos; needle.style.left = state.pos + "%";
      range.setAttribute("aria-valuetext", "Dial en " + Math.round(state.pos) + " de 100, banda " + state.band);
      meter.style.width = Math.round(c * 100) + "%";
      dial.setAttribute("aria-hidden", "true"); box.classList.toggle("on", state.on); box.classList.toggle("found", c >= 0.75);
      dial.style.setProperty("--noise", state.on ? (1 - c).toFixed(2) : "0");
      if (!state.on) msg = D.off;
      else if (c >= 0.75) msg = n.st.name + " (" + state.band + "). " + n.st.msg;
      else if (c >= 0.3) msg = D.near;
      else msg = D.noise;
      if (msg !== lastMsg) { lastMsg = msg; out.textContent = msg; }
    }

    power.addEventListener("click", function () { set({ on: !state.on }, true); });
    range.addEventListener("input", function () { set({ pos: +range.value }, true); });
    bandBtns.forEach(function (b) { b.addEventListener("click", function () { set({ band: b.getAttribute("data-band") }, true); }); });
    /* la barra del dial también se arrastra con el cursor o el dedo (solo con la radio encendida) */
    var dragging = false;
    function fromX(e) { var r = dial.getBoundingClientRect(); return Math.round(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100))); }
    dial.addEventListener("pointerdown", function (e) {
      if (!state.on) return;
      dragging = true; try { dial.setPointerCapture(e.pointerId); } catch (x) {}
      dial.classList.add("drag"); set({ pos: fromX(e) }, true); e.preventDefault();
    });
    dial.addEventListener("pointermove", function (e) { if (dragging) set({ pos: fromX(e) }, true); });
    function endDrag() { dragging = false; dial.classList.remove("drag"); }
    dial.addEventListener("pointerup", endDrag); dial.addEventListener("pointercancel", endDrag);
    view = update; update();
    return function unmount() { if (view === update) view = null; };
  }

  api = { mount: mount, state: state, set: set, reset: reset, clarity: clarity, audioCap: 1 };
  return api;
})();
