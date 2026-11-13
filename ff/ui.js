/* Copia de ../../vr/ui.js adaptada a IWSDK: las entidades vienen de src/shim.js (FFX) y el resaltado al apuntar llega con los eventos de rayo. */
/* Free Frequency VR — paneles 2D dentro del mundo 3D (tarjetas, botones, globos, pantallas).
   Se dibujan en un canvas con las mismas reglas de css/styles.css (Montserrat, crema/tinta/amarillo de la señal, botones en píldora)
   y se muestran como un plano en la escena. Los botones son "regiones" del canvas: el rayo (ratón o control VR) toca el plano y
   la coordenada UV dice qué región se tocó. */
window.VRUI = (function () {
  "use strict";
  var C = { ink: "#23251f", inkSoft: "#5d5a4c", cream: "#f6ecd6", paper: "#fbf5e6", line: "#e2d6b8", signal: "#f5b335", moss: "#2f5d3a",
    brick: "#b5523a", teal: "#14303a", red: "#d7342a", green: "#2f8a4a", gold: "#94650f", peach: "#ffdca0" };
  var RES = 2.4;   // píxeles del canvas por píxel de diseño
  var FONT = 'Montserrat, "Segoe UI", system-ui, sans-serif';
  function font(size, weight, italic) { return (italic ? "italic " : "") + (weight || 400) + " " + size + "px " + FONT; }
  function ls(ctx, em, size) { if ("letterSpacing" in ctx) ctx.letterSpacing = (em || 0) * size + "px"; }

  /* ---------- texto enriquecido: partes con estilo propio (p. ej. «Free *Frequency*») ---------- */
  var PRESET = {
    h1: { size: 40, weight: 700, lh: 1.08, ls: -0.02, mb: 10 },
    h2: { size: 30, weight: 700, lh: 1.08, ls: -0.02, mb: 10 },
    h3: { size: 11.5, weight: 700, upper: true, ls: 0.15, color: C.inkSoft, mt: 16, mb: 7 },
    p: { size: 15, weight: 400, lh: 1.6, mb: 12 },
    small: { size: 12.5, weight: 500, lh: 1.45, color: C.inkSoft, mb: 6 },
    kicker: { size: 12, weight: 700, upper: true, ls: 0.16, color: C.moss, mb: 10 },
    name: { size: 21, weight: 700, lh: 1.12, ls: -0.01, mb: 7 },
    tag: { size: 10.5, weight: 700, upper: true, ls: 0.14, color: C.moss, mb: 4 }
  };
  function tokens(it) {
    var parts = it.parts || [[it.text == null ? "" : String(it.text), {}]], out = [];
    parts.forEach(function (p) {
      var st = p[1] || {}, s = it.upper ? String(p[0]).toUpperCase() : String(p[0]);
      s.split("\n").forEach(function (line, li) {
        if (li > 0) out.push({ br: true });
        line.split(/( )/).forEach(function (w) { if (w !== "") out.push({ w: w, st: st }); });
      });
    });
    return out;
  }
  function tfont(it, st) { return font(st.size || it.size, st.weight || it.weight || 400, st.italic != null ? st.italic : it.italic); }
  function layoutText(ctx, it, maxW) {
    var lines = [[]], widths = [0], toks = tokens(it);
    toks.forEach(function (t) {
      if (t.br) { lines.push([]); widths.push(0); return; }
      ctx.font = tfont(it, t.st); ls(ctx, it.ls, it.size); var w = ctx.measureText(t.w).width; t.width = w;
      var L = lines.length - 1;
      if (t.w === " " && !lines[L].length) return;
      if (widths[L] + w > maxW && lines[L].length && t.w !== " ") {
        while (lines[L].length && lines[L][lines[L].length - 1].w === " ") { widths[L] -= lines[L].pop().width; }
        lines.push([]); widths.push(0); L++;
      }
      lines[L].push(t); widths[L] += w;
    });
    lines.forEach(function (ln, i) { while (ln.length && ln[ln.length - 1].w === " ") widths[i] -= ln.pop().width; });
    return { lines: lines, widths: widths };
  }
  function drawText(ctx, it, x, y, w, draw) {
    var L = layoutText(ctx, it, w), lh = it.size * (it.lh || 1.3);
    if (draw) {
      ctx.textBaseline = "middle";
      L.lines.forEach(function (ln, i) {
        var lw = L.widths[i], cx = it.align === "center" ? x + (w - lw) / 2 : it.align === "right" ? x + w - lw : x;
        var justify = it.justify && i < L.lines.length - 1 && ln.length > 2, spaces = ln.filter(function (t) { return t.w === " "; }).length;
        var extra = justify && spaces ? (w - lw) / spaces : 0;
        ln.forEach(function (t) {
          ctx.font = tfont(it, t.st); ls(ctx, it.ls, it.size); ctx.fillStyle = t.st.color || it.color;
          if (it.shadow) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 1; }
          ctx.globalAlpha = it.alpha == null ? 1 : it.alpha;
          ctx.fillText(t.w, cx, y + lh * (i + 0.5) + it.size * 0.04);
          if (it.strike) { ctx.fillRect(cx, y + lh * (i + 0.5), t.width, Math.max(1, it.size * 0.08)); }
          ctx.shadowColor = "transparent"; ctx.globalAlpha = 1;
          cx += t.width + (t.w === " " ? extra : 0);
        });
      });
      ls(ctx, 0, it.size);
    }
    return L.lines.length * lh;
  }

  /* ---------- botones (píldoras) ---------- */
  var BTN = {
    cream: { bg: C.cream, fg: C.ink, hover: "#ffffff", shadow: true },
    signal: { bg: C.signal, fg: C.ink, hover: "#ffc552", shadow: true },
    ink: { bg: C.ink, fg: C.cream, hover: "#3a3d34" },
    outline: { bg: "rgba(0,0,0,0)", fg: C.ink, border: C.ink, hover: "rgba(35,37,31,.08)" },
    light: { bg: "rgba(255,255,255,0)", fg: "#ffffff", border: "rgba(255,255,255,.75)", hover: "rgba(255,255,255,.14)" },
    link: { bg: "rgba(0,0,0,0)", fg: "#ffffff", underline: true, hover: "rgba(255,255,255,.1)" },
    red: { bg: C.red, fg: "#ffffff", hover: "#e5483e" },
    green: { bg: C.green, fg: "#ffffff", hover: "#38a056" },
    white: { bg: "#ffffff", fg: C.ink, hover: C.cream, shadow: true },
    dark: { bg: "rgba(10,13,22,.62)", fg: "#ffffff", hover: "rgba(10,13,22,.8)" }
  };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, h / 2, w / 2))); }

  /* ---------- elementos de una tarjeta: cada uno devuelve su alto ---------- */
  var ITEMS = {
    text: function (ctx, it, x, y, w, d) { return drawText(ctx, it, x, y, w, d); },
    gap: function (ctx, it) { return it.h || 10; },
    hr: function (ctx, it, x, y, w, d) { if (d) { ctx.fillStyle = it.color || C.line; ctx.fillRect(x, y + 6, w, 1.5); } return 14; },
    buttons: function (ctx, it, x, y, w, d, S) {
      var size = it.size || 15, h = it.h || Math.round(size * 2.9), padX = it.padX || 20, gap = it.gap || 10, rows = [[]], rw = [0];
      it.list.forEach(function (b) {
        if (!b) return;
        ctx.font = font(size, 700); var bw = it.full ? w : Math.ceil(ctx.measureText(b.label).width + padX * 2 + (b.icon ? size * 1.1 : 0));
        var R2 = rows.length - 1;
        if (rw[R2] + bw > w + 0.5 && rows[R2].length) { rows.push([]); rw.push(0); R2++; }
        rows[R2].push({ b: b, w: bw }); rw[R2] += bw + gap;
      });
      rows.forEach(function (row, ri) {
        var total = rw[ri] - gap, cx = it.align === "center" ? x + (w - total) / 2 : it.align === "right" ? x + w - total : x, cy = y + ri * (h + gap);
        row.forEach(function (o) {
          var b = o.b, st = BTN[b.kind || "cream"], hov = S.hover === b.id && !b.disabled, lift = hov && !it.flat ? -2 : 0;
          if (d) {
            ctx.globalAlpha = b.disabled ? 0.4 : 1;
            if (st.shadow && !it.flat) { ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = hov ? 18 : 12; ctx.shadowOffsetY = hov ? 8 : 5; }
            rr(ctx, cx, cy + lift, o.w, h, b.radius != null ? b.radius : 999); ctx.fillStyle = hov ? st.hover : (b.active ? (st.active || C.signal) : st.bg); ctx.fill();
            ctx.shadowColor = "transparent";
            if (st.border) { ctx.lineWidth = 2; ctx.strokeStyle = st.border; ctx.stroke(); }
            if (S.selected === b.id || b.ring) { ctx.lineWidth = 3; ctx.strokeStyle = C.signal; rr(ctx, cx - 3, cy + lift - 3, o.w + 6, h + 6, 999); ctx.stroke(); }
            ctx.font = font(size, 700); ctx.fillStyle = b.fg || st.fg; ctx.textBaseline = "middle"; ctx.textAlign = "center";
            ctx.fillText((b.icon ? b.icon + "  " : "") + b.label, cx + o.w / 2, cy + lift + h / 2 + 1);
            if (st.underline) ctx.fillRect(cx + padX, cy + h / 2 + size * 0.75, o.w - padX * 2, 1.5);
            ctx.textAlign = "left"; ctx.globalAlpha = 1;
          }
          if (!b.disabled) S.region(b.id, cx, cy, o.w, h, b);
          cx += o.w + gap;
        });
      });
      return rows.length * h + (rows.length - 1) * gap;
    },
    chips: function (ctx, it, x, y, w, d, S) {
      var size = it.size || 13.5, h = Math.round(size * 2.7), gap = 8, cx = x, cy = y;
      it.list.forEach(function (c) {
        ctx.font = font(size, 600); var cw = Math.ceil(ctx.measureText(c.label).width + 28);
        if (cx + cw > x + w && cx > x) { cx = x; cy += h + gap; }
        if (d) {
          var hov = S.hover === c.id && c.state !== "off" && c.state !== "on";
          ctx.globalAlpha = c.state === "off" ? 0.4 : 1;
          rr(ctx, cx, cy, cw, h, 999);
          ctx.fillStyle = c.state === "on" ? C.moss : c.state === "bad" ? "#f6d7d0" : hov ? C.cream : "#ffffff"; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = c.state === "on" ? C.moss : c.state === "bad" ? C.brick : hov ? C.signal : C.line; ctx.stroke();
          ctx.fillStyle = c.state === "on" ? "#ffffff" : c.state === "bad" ? C.brick : C.ink; ctx.textBaseline = "middle"; ctx.textAlign = "center";
          ctx.fillText(c.label, cx + cw / 2, cy + h / 2 + 1);
          if (c.state === "bad") ctx.fillRect(cx + 14, cy + h / 2, cw - 28, 1.5);
          ctx.textAlign = "left"; ctx.globalAlpha = 1;
        }
        if (c.state !== "off" && c.state !== "on") S.region(c.id, cx, cy, cw, h, c);
        cx += cw + gap;
      });
      return cy - y + h;
    },
    facts: function (ctx, it, x, y, w, d) {
      var yy = y, ICON = { yes: [C.green, "✓"], no: ["#8b8778", "✕"], warn: ["#d08a16", "!"] };
      it.list.forEach(function (f) {
        var ic = ICON[f[0]] || ICON.warn, t = { size: 13.5, lh: 1.45, color: C.ink, parts: [[f[1] + ": ", { weight: 700 }], [f[2], {}]] };
        var th = drawText(ctx, t, x + 36, yy, w - 36, false);
        if (d) {
          ctx.beginPath(); ctx.arc(x + 13, yy + 13, 12, 0, Math.PI * 2); ctx.fillStyle = ic[0]; ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = font(13, 800); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ic[1], x + 13, yy + 14); ctx.textAlign = "left";
          drawText(ctx, t, x + 36, yy + Math.max(0, (26 - 13.5 * 1.45) / 2), w - 36, true);
        }
        yy += Math.max(28, th) + 8;
      });
      return yy - y;
    },
    steps: function (ctx, it, x, y, w, d, S) {   // como .seq-steps: puntos y nombres de los pasos
      var size = 12, h = 34, cx = x + 14;
      if (d) { rr(ctx, x, y, w, h, 999); ctx.fillStyle = "rgba(10,13,22,.62)"; ctx.fill(); }
      var each = (w - 28) / it.list.length;
      it.list.forEach(function (s, i) {
        var on = i <= it.active;
        if (d) {
          ctx.globalAlpha = on ? 1 : 0.55;
          ctx.beginPath(); ctx.arc(cx + 6, y + h / 2, 5, 0, Math.PI * 2);
          if (on) { ctx.fillStyle = C.signal; ctx.fill(); } else { ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.stroke(); }
          if (i === it.active) { ctx.beginPath(); ctx.arc(cx + 6, y + h / 2, 9, 0, Math.PI * 2); ctx.strokeStyle = "rgba(245,179,53,.35)"; ctx.lineWidth = 4; ctx.stroke(); }
          ctx.font = font(size, 600); ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(s, cx + 18, y + h / 2 + 1);
          ctx.globalAlpha = 1;
        }
        if (it.clickable) S.region("step:" + i, cx - 4, y, each, h);
        cx += each;
      });
      return h;
    },
    image: function (ctx, it, x, y, w, d) {
      var h = it.h || w * 0.56;
      if (d && it.img && it.img.complete && it.img.naturalWidth) {
        ctx.save(); rr(ctx, x, y, w, h, it.radius || 0); ctx.clip();
        var iw = it.img.naturalWidth, ih = it.img.naturalHeight, s = Math.max(w / iw, h / ih);
        ctx.drawImage(it.img, x + (w - iw * s) / 2, y + (h - ih * s) * (it.valign == null ? 0.5 : it.valign), iw * s, ih * s); ctx.restore();
      }
      return h;
    },
    custom: function (ctx, it, x, y, w, d, S) { var h = typeof it.h === "function" ? it.h(w) : it.h; if (d) { if (it.regions) it.regions(x, y, w, h, S); it.draw(ctx, x, y, w, h, S); } return h; },
    row: function (ctx, it, x, y, w, d, S) {   // columnas: [{w: fracción, items: [...]}, ...]
      var cx = x, maxH = 0, gap = it.gap || 16;
      it.cols.forEach(function (col) {
        var cw = (w - gap * (it.cols.length - 1)) * col.w;
        var hh = items(ctx, col.items, cx, y, cw, d, S); maxH = Math.max(maxH, hh); cx += cw + gap;
      });
      return maxH;
    }
  };
  function items(ctx, list, x, y, w, d, S) {
    var yy = y;
    list.forEach(function (raw, i) {
      if (!raw) return;
      var it = raw, base = PRESET[it.t];
      if (base) { it = Object.assign({}, base, raw); it.t = "text"; }
      if (it.t === "text") it = Object.assign({ size: 15, weight: 400, lh: 1.4, color: S.color, mb: 0 }, it);
      var mt = it.mt != null && yy > y ? it.mt : 0;
      yy += mt;
      yy += ITEMS[it.t](ctx, it, x, yy, w, d, S);
      if (i < list.length - 1) yy += it.mb || 0;
    });
    return yy - y;
  }

  /* ---------- Panel: un plano en la escena con una tarjeta dibujada ---------- */
  var all = [];
  function Panel(o) {
    this.o = o; this.spec = null; this.hover = null; this.regions = [];
    var el = this.el = FFX.entity();
    (o.parent || FFX.sceneEl).appendChild(el);
    if (o.pos) el.object3D.position.set(o.pos[0], o.pos[1], o.pos[2]);
    if (o.rot) el.object3D.rotation.set(o.rot[0] * Math.PI / 180, o.rot[1] * Math.PI / 180, (o.rot[2] || 0) * Math.PI / 180);
    this.canvas = document.createElement("canvas");
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: false, toneMapped: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.userData.panel = this; this.mesh.renderOrder = o.order || 2;
    el.setObject3D("mesh", this.mesh);   // así el raycaster de A-Frame lo encuentra
    /* stand: la tarjeta está de pie sobre la mesa (anchor «bottom» en y = 0) con un soporte oscuro en la base; así no flota */
    if (o.stand) {
      var foot = new THREE.Mesh(new THREE.BoxGeometry(o.w * 0.6, 0.008, 0.045), new THREE.MeshLambertMaterial({ color: 0x23251f }));
      foot.position.set(0, 0.004, -0.004); foot.raycast = function () {};
      var lip = new THREE.Mesh(new THREE.BoxGeometry(o.w * 0.6, 0.014, 0.004), new THREE.MeshLambertMaterial({ color: 0xf5b335 }));
      lip.position.set(0, 0.007, 0.019); lip.raycast = function () {};
      el.object3D.add(foot); el.object3D.add(lip);
    }
    var self = this;
    ["click", "mousedown", "mouseup"].forEach(function (ev) {
      el.addEventListener(ev, function (e) {
        var hit = e.detail && e.detail.intersection; if (!hit || !hit.uv) { if (ev === "mouseup" && self.o.onUp) self.o.onUp(null); return; }
        var id = self.at(hit.uv);
        if (ev === "click") { if (id && self.o.onClick) { var now = performance.now(); if (now - (self.lastClick || 0) < 220) return; self.lastClick = now; self.o.onClick(id, self.find(id)); } }
        else if (ev === "mousedown") { if (self.o.onDown) self.o.onDown(id); }
        else if (self.o.onUp) self.o.onUp(id);
      });
    });
    /* resaltado al apuntar (IWSDK): el rayo del ratón, del control o de la mano dice qué botón está debajo */
    ["mouseenter", "mousemove"].forEach(function (ev) {
      el.addEventListener(ev, function (e) { var hit = e.detail && e.detail.intersection; if (hit && hit.uv) self.setHover(self.at(hit.uv)); });
    });
    el.addEventListener("mouseleave", function () { self.setHover(null); });
    if (o.spec) this.set(o.spec);
    all.push(this);
  }
  Panel.prototype.find = function (id) { for (var i = 0; i < this.regions.length; i++) if (this.regions[i].id === id) return this.regions[i].data; return null; };
  Panel.prototype.at = function (uv) {
    var x = uv.x * this.W, y = (1 - uv.y) * this.H;
    for (var i = this.regions.length - 1; i >= 0; i--) { var r = this.regions[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id; }
    return null;
  };
  Panel.prototype.set = function (spec) { this.spec = spec; this.draw(); return this; };
  Panel.prototype.draw = function () {
    var sp = this.spec; if (!sp) return;
    var W = sp.w || 400, pad = sp.pad == null ? [18, 20, 20, 20] : typeof sp.pad === "number" ? [sp.pad, sp.pad, sp.pad, sp.pad] : sp.pad;
    var tail = sp.tail ? 16 : 0, sh = sp.shadow ? 26 : 0, self = this;
    var S = { hover: this.hover, selected: sp.selected, color: sp.color || C.ink, region: function () {} };
    var ctx = this.canvas.getContext("2d");
    var inner = items(ctx, sp.items || [], 0, 0, W - pad[1] - pad[3] - (sp.stripe ? 6 : 0), false, S);
    var H = Math.ceil(sp.h || inner + pad[0] + pad[2]);
    var CW = Math.round((W + sh * 2) * RES), CH = Math.round((H + tail + sh * 2) * RES);
    if (this.canvas.width !== CW || this.canvas.height !== CH) {
      this.canvas = document.createElement("canvas"); this.canvas.width = CW; this.canvas.height = CH;
      this.tex.dispose(); this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
      this.mat.map = this.tex; this.mat.needsUpdate = true;
    }
    ctx = this.canvas.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, CW, CH);
    ctx.setTransform(RES, 0, 0, RES, sh * RES, sh * RES);
    this.regions = [];
    S.region = function (id, x, y, w, h, data) { self.regions.push({ id: id, x: x + sh, y: y + sh, w: w, h: h, data: data }); };
    if (sp.bg || sp.border) {
      if (sp.shadow) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; }
      rr(ctx, 0, 0, W, H, sp.radius == null ? 20 : sp.radius);
      if (sp.tail) { var tx = sp.tail === "left" ? 46 : sp.tail === "right" ? W - 46 : W / 2; ctx.moveTo(tx - 12, H - 1); ctx.lineTo(tx + (sp.tail === "left" ? -10 : sp.tail === "right" ? 10 : 0), H + tail); ctx.lineTo(tx + 12, H - 1); }
      if (sp.bg) { ctx.fillStyle = sp.bg; ctx.fill(); }
      ctx.shadowColor = "transparent";
      if (sp.border) { ctx.lineWidth = sp.borderW || 3; ctx.strokeStyle = sp.border; ctx.stroke(); }
      if (sp.stripe) { ctx.save(); rr(ctx, 0, 0, W, H, sp.radius == null ? 20 : sp.radius); ctx.clip(); ctx.fillStyle = sp.stripe; ctx.fillRect(0, 0, 6, H); ctx.restore(); }
    }
    if (sp.paint) sp.paint(ctx, W, H, S);
    items(ctx, sp.items || [], pad[3] + (sp.stripe ? 6 : 0), pad[0], W - pad[1] - pad[3] - (sp.stripe ? 6 : 0), true, S);
    this.tex.needsUpdate = true;
    this.W = W + sh * 2; this.H = H + tail + sh * 2;
    var m = this.o.w / W;   // metros por píxel de diseño
    this.mesh.scale.set(this.W * m, this.H * m, 1);
    var anchor = this.o.anchor || "center";
    this.mesh.position.y = anchor === "top" ? -this.H * m / 2 + sh * m : anchor === "bottom" ? this.H * m / 2 - sh * m : 0;
    this.heightM = H * m;
    this.el.classList.toggle("clickable", this.regions.length > 0 && this.visible());
  };
  Panel.prototype.visible = function () { var n = this.el.object3D; while (n) { if (!n.visible) return false; n = n.parent; } return true; };
  Panel.prototype.show = function (v) { this.el.object3D.visible = !!v; refresh(); return this; };
  Panel.prototype.setHover = function (id) { if (id === this.hover) return; this.hover = id; this.draw(); };
  function refresh() {
    all.forEach(function (p) { p.el.classList.toggle("clickable", p.regions.length > 0 && p.visible()); if (!p.visible() && p.hover) p.setHover(null); });
    FFX.query("vr-hit").forEach(function (e) {
      var v = true, n = e.object3D; while (n) { if (!n.visible) { v = false; break; } n = n.parent; }
      e.classList.toggle("clickable", v && !(e.noTouch && e.noTouch()));
    });
  }

  /* resaltado al apuntar: en cada fotograma se mira qué toca cada rayo (ratón y controles) */
  AFRAME.registerSystem("vrui", {
    tick: function () {
      var hits = new Map(), rays = [this.el.components.raycaster];
      document.querySelectorAll("[laser-controls]").forEach(function (h) { if (h.components.raycaster) rays.push(h.components.raycaster); });
      rays.forEach(function (rc) {
        if (!rc || !rc.intersections || !rc.intersections.length) return;
        var hit = rc.intersections[0], p = hit.object && hit.object.userData.panel;
        if (p && hit.uv) hits.set(p, p.at(hit.uv));
      });
      all.forEach(function (p) { p.setHover(hits.has(p) ? hits.get(p) : null); });
    }
  });

  function loadFonts() {
    if (!document.fonts) return Promise.resolve();
    var list = ["400 20px Montserrat", "500 20px Montserrat", "600 20px Montserrat", "700 20px Montserrat", "800 20px Montserrat", "italic 600 20px Montserrat", "italic 700 20px Montserrat", "italic 400 20px Montserrat"];
    return Promise.all(list.map(function (f) { return document.fonts.load(f); })).catch(function () {}).then(function () { all.forEach(function (p) { p.draw(); }); });
  }
  return { C: C, Panel: Panel, refresh: refresh, loadFonts: loadFonts, font: font, rr: rr, drawText: drawText };
})();
