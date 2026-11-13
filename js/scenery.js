/* Escenarios 3D de las dos zonas (material "toon" del proyecto):
   · rural — Cauca: el escenario modelado en Blender (assets/models/rural/escenario rural/…glb: casas, montañas, camino y árboles frutales) con el mismo
     toon shader (Substance) que la ciudad, bajo el cielo con nubes. Si el archivo no carga, se usa el paisaje ilustrado de la vereda (ruralLand).
   · urbano — Cali: el escenario modelado en Blender (assets/models/urbano/escenario urbano/…glb) bajo un cielo de atardecer. Se descarga una sola vez y cada
     escena usa una copia; sus colores se pasan a material toon. Si el archivo no carga, se usa la ciudad genérica de respaldo (edificios con ventanas,
     torre, calle, postes de luz, palmas y objetos de calle).
   Pensado para móviles de gama media: ~60–80 mallas, geometrías y materiales compartidos, sin sombras proyectadas.
   `build()` devuelve { sky, update(t, amp) }: `amp` (0–1) es la intensidad de la simulación del sismo; en reposo es 0. */
window.FFScenery = (function () {
  "use strict";

  function skyTexture(THREE, stops) {
    var c = document.createElement("canvas"); c.width = 8; c.height = 256; var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    return new THREE.CanvasTexture(c);
  }

  /* escenario urbano modelado en Blender (Free Frequency, Cali). Unidades del archivo: metros; las fachadas miran hacia +z y la calle queda al frente.
     scale: metros → unidades de la escena (la chica mide 4,4 unidades); at: punto del modelo (x, z, en metros) donde quedan los pies de la chica. */
  var CITY = { file: "assets/models/urbano/escenario urbano/Escenario Urbano Free Frecuency.glb", scale: 2, at: [-7, 27], farGround: 0x9c8f7e,
    wide: { dy: 1.2, dl: 1.2, fill: [0.26, 0.5] }, roadAhead: 40 };
  /* wide: el mismo encuadre de la zona rural (cámara más lejos y más alta; la chica ocupa la mitad del alto), para que las dos escenas se vean igual.
     scale: con 2 la chica (4,4 unidades) mide ≈2,2 m: más pequeña que las casas (antes, a escala 1, medía 4,4 m y quedaba más alta que ellas).
     at: la chica queda en la calle, unos 9 m delante de la calzada del modelo, para que la cámara vea la cuadra completa: el Gato de Tejada, las casas,
     las torres, los postes y el paradero.
     roadAhead: metros de asfalto que se agregan delante de la calzada del modelo, hasta más allá de la cámara (antes la calle quedaba corta). */
  /* escenario rural modelado en Blender (Cauca), convertido de cauca_montanas1.fbx a GLB (misma carpeta; el anterior, de cauca_mejorado.fbx, se conserva).
     La conversión (web_paso2_fbx_a_glb.py) mantiene formas y posiciones, agrega las hojas de los árboles (Geometry Nodes, vacías en el FBX),
     devuelve el color a los materiales procedurales e incrusta las texturas de ladrillo y tejas. Unidades del archivo: metros.
     Se gira 180° para que las casas y las montañas queden de frente a la cámara, como en la cámara del archivo.
     at: punto del modelo (x, y de Blender, en metros) donde quedan los pies de Mateo: delante del camino de tierra, con las casas detrás.
     ground: mallas del suelo; no usan el toon shader (vistas casi de canto caerían en su escalón negro) y reciben la sombra de Mateo. */
  /* charScale: tamaño de Mateo en esta zona (1 = 4,4 unidades). Con 1 quedaba más alto que las casas; el escenario y los árboles no cambian:
     solo Mateo (y los objetos en su mano) se achican (ver js/sequence.js y js/seq-modules.js). */
  var RURAL = { file: "assets/models/rural/escenario rural/cauca_montanas1.glb", scale: 2.6, at: [0.7, 5.2], farGround: 0x3f6a22, charScale: 0.66, house: { scale: 1.35 },
    ground: /^(Plano|Camino_Tierra|Losa_Piso)(\.|_|$)|Piso_Corredor/, sway: /^Casa_/, tree: /^(Cubo|Follaje|Guayaba|Limon|Naranja|Arbol|Tronco|Hoja)/i,
    /* wide: cámara del plano completo. Mateo es más pequeño (charScale): fill más alto acerca la cámara y dy/dl la bajan a su altura */
    wide: { dy: 0.5, dl: 0.3, fill: [0.36, 0.68] },
    /* walk: la caminata de «El mensaje en espera» (los mismos puntos que WALK en js/sequence.js). Empieza a la izquierda, junto a los árboles
       (detrás del inicio anterior pasaba el camino y a la derecha estaba la casa: no cabía ninguno), y termina en el claro, más a la derecha */
    walk: { from: [-1.6, -1.0], fromPortrait: [-1.0, -1.2], to: [2.2, 0.4] } };
  var loads = {};
  /* cada archivo se descarga y se procesa una sola vez; cada escena usa una copia */
  function loadGLB(THREE, file) {
    if (!loads[file]) {
      loads[file] = new Promise(function (resolve, reject) {
        if (!THREE.GLTFLoader) { reject(new Error("GLTFLoader no disponible")); return; }
        new THREE.GLTFLoader().load(encodeURI(file), function (gltf) { resolve(gltf.scene); }, undefined, reject);
      });
      loads[file].catch(function () { delete loads[file]; });   // si falla, se vuelve a intentar en la próxima visita
    }
    return loads[file];
  }
  function loadCity(THREE) { return loadGLB(THREE, CITY.file); }
  /* materiales del modelo → material toon del proyecto con el toon shader de Substance (js/toon-shader.js), salvo el suelo.
     Devuelve los materiales con shader: de noche se oscurecen a mano, porque el shader no usa las luces de la escena. */
  /* suave (zona rural): usa FFToon.soft y conserva la textura y los colores por vértice del modelo si los tiene */
  /* isSoft (opcional, zona rural): las mallas que conservan el toon suave (los árboles); el resto lleva el toon shader completo */
  function toonize(root, M, envMat, isGround, suave, isSoft) {
    var cmats = new Map(), shaded = [];
    root.traverse(function (o) {
      if (!o.isMesh) return;
      var ground = isGround(o), s = o.material, soft = !!(isSoft && isSoft(o)), key = (ground ? "suelo:" : soft ? "suave:" : "") + s.uuid;
      if (!cmats.has(key)) {
        var m = M.toon(0xffffff, { side: s.side }); m.name = s.name; m.color.copy(s.color); m.userData.base.copy(s.color);
        if (suave) { if (s.map) m.map = s.map; if (s.vertexColors) m.vertexColors = true; }
        if (!ground && window.FFToon) {
          if (suave && soft && window.FFToon.soft) window.FFToon.soft(m, /^Hoja/i.test(s.name) ? { edge: false, twoSided: true } : null);   // hojas: sin contorno y luz por ambas caras
          else window.FFToon.apply(m);
          shaded.push(m);
        }
        cmats.set(key, envMat(m));
      }
      o.material = cmats.get(key); o.castShadow = false; o.receiveShadow = ground;
    });
    return shaded;
  }

  function build(X, kind) {
    var THREE = X.THREE, M = X.M, env = X.env, V = X.V;
    var mats = {};
    function mat(color) { if (!mats[color]) mats[color] = X.envMat(M.toon(color)); return mats[color]; }
    function add(parent, geo, color, x, y, z, sx, sy, sz, ry) {
      var m = new THREE.Mesh(geo, typeof color === "number" ? mat(color) : color); m.position.set(x, y, z); if (sx !== undefined) m.scale.set(sx, sy, sz); if (ry) m.rotation.y = ry; parent.add(m); return m;
    }
    var box = new THREE.BoxGeometry(1, 1, 1), cone = new THREE.ConeGeometry(1, 1, 7), cone4 = new THREE.ConeGeometry(1, 1, 4), cyl = new THREE.CylinderGeometry(1, 1, 1, 9), sph = new THREE.SphereGeometry(1, 12, 8), hill = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
    var swayers = [], jitter = [], lamps = [], clouds = [];
    var group = new THREE.Group(); env.add(group);

    if (kind === "rural") {
      var skyT = skyTexture(THREE, [[0, "#8fc1d8"], [0.55, "#d8e9e2"], [1, "#f1efd8"]]);   // el cielo de siempre (degradado y nubes); el paisaje va delante
      /* nubes */
      [[-12, 11, -23], [6, 13, -24], [18, 10, -23]].forEach(function (c) { var g = new THREE.Group(); g.position.set(c[0], c[1], c[2]); group.add(g); var cm = X.envMat(new THREE.MeshBasicMaterial({ color: 0xffffff })); [[0, 0, 2.2], [1.8, -0.2, 1.7], [-1.8, -0.3, 1.6]].forEach(function (p) { add(g, sph, cm, p[0], p[1], 0, p[2], p[2] * 0.55, p[2] * 0.6); }); clouds.push(g); });
      var land = null, night = false, rShaded = [], RNIGHT = new THREE.Color(0.26, 0.28, 0.38);
      function rTint() { rShaded.forEach(function (m) { m.color.copy(m.userData.base); if (night) m.color.multiply(RNIGHT); }); }
      X.status && X.status("loading");
      loadGLB(THREE, RURAL.file).then(function (src) {
        var S = RURAL.scale, vereda = src.clone(true), holder = new THREE.Group();
        holder.rotation.y = Math.PI; holder.scale.setScalar(S); holder.position.set(RURAL.at[0] * S, 0, -RURAL.at[1] * S); holder.add(vereda);
        /* toon shader completo (el mismo de los objetos y la ciudad) en casas, montañas y camino; los árboles (troncos, follaje y frutos) conservan el toon suave */
        rShaded = toonize(vereda, M, X.envMat, function (o) { for (var p = o; p && p !== vereda; p = p.parent) if (RURAL.ground.test(p.name || "")) return true; return false; }, true,
          function (o) { return RURAL.tree.test(o.name || "") || /^(Hoja|Fruto)/i.test((o.material && o.material.name) || ""); });
        /* suelo: en el archivo el pasto («Plano») quedó 0,8 m por debajo de las casas y del camino, y Mateo (pies en y = 0) se veía flotando.
           El pasto sube hasta justo debajo de y = 0 y el camino de tierra queda apoyado sobre él (las casas ya empiezan en y = 0). */
        /* se mide en el espacio del escenario ya escalado (holder: ×2,6 y girado), sin depender de dónde esté colgado en la escena */
        var setTop = function (node, y, useMin) {
          if (!node) return;
          holder.updateMatrixWorld(true);   // holder aún no está en la escena: su matriz (×2,6, giro y posición) es la del mundo
          var b = new THREE.Box3().setFromObject(node), dy = y - (useMin ? b.min.y : b.max.y), par = node.parent;
          var a0 = par.worldToLocal(new THREE.Vector3(0, 0, 0)), a1 = par.worldToLocal(new THREE.Vector3(0, dy, 0));
          node.position.add(a1.sub(a0));
        };
        setTop(vereda.getObjectByName("Plano"), -0.012, false); setTop(vereda.getObjectByName("Camino_Tierra"), -0.004, true);
        growHouses(vereda, holder);
        vereda.children.forEach(function (node) { if (RURAL.sway.test(node.name || "")) swayers.push({ g: node, h: 3, ph: node.position.x * 0.7 }); });   // sismo: las casas oscilan desde su base
        group.add(holder); rTint();
        plantCityTrees(vereda);
        var far = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(RURAL.farGround)); far.rotation.x = -Math.PI / 2; far.scale.set(400, 300, 1); far.position.set(0, -0.35 * S, -120); group.add(far);   // potrero lejano hasta el horizonte
        if (X.ground) X.ground.visible = false;
        X.status && X.status("ready");
      }).catch(function (err) {
        console.error("Escenario rural (GLB):", err);
        land = ruralLand(X); land.night(night); out.fit = land.fit; out.wide = { dy: 1.2, dl: 1.2, fill: [0.26, 0.52] };   // respaldo: el paisaje ilustrado
        X.status && X.status("error");
      });
      /* Casas más grandes (RURAL.house): cada casa crece desde un punto de su base. La casa de ladrillo (junto al claro de la historia del SMS) crece
         desde su esquina delantera izquierda, hacia atrás y a la derecha: no invade el claro ni el camino. La casa del corredor está hecha de muchas
         piezas sueltas (pilares, vigas, muros, techo…): se juntan en un grupo «Casa_Corredor» y crecen juntas. */
      function growHouses(vereda, holder) {
        var H = RURAL.house; if (!H || H.scale === 1) return;
        var parts = vereda.children.filter(function (c) { return /^(Pilar_|Viga_|Losa_Piso|Muros_|Zocalo|Culata_|Techo_|Cumbrera|Fronton_|Puerta_|Ventana_)/.test(c.name || ""); });
        var houses = vereda.children.filter(function (c) { return /^Casa_/.test(c.name || ""); }).map(function (c) { return { name: c.name, nodes: [c] }; });
        if (parts.length) houses.push({ name: "Casa_Corredor", nodes: parts });
        houses.forEach(function (h) {
          holder.updateMatrixWorld(true);
          var b = new THREE.Box3(); h.nodes.forEach(function (n) { b.union(new THREE.Box3().setFromObject(n)); });
          var front = h.name === "Casa_Ladrillo_Teja";   // la del claro: crece desde su esquina delantera izquierda
          var pivot = new THREE.Vector3(front ? b.min.x : (b.min.x + b.max.x) / 2, b.min.y, front ? b.max.z : (b.min.z + b.max.z) / 2);
          var g = new THREE.Group(); g.name = h.nodes.length > 1 ? h.name : h.name + "_grupo";
          g.position.copy(vereda.worldToLocal(pivot.clone())); vereda.add(g); g.updateMatrixWorld(true);
          h.nodes.forEach(function (n) { g.attach(n); });
          g.scale.setScalar(H.scale);
        });
        holder.updateMatrixWorld(true);
      }
      /* Árboles: los frutales del modelo rural se ocultan y en su lugar van los árboles del escenario de Cali (ARBOL_11…14), repartidos al azar con
         una semilla fija (siempre el mismo bosque). Una arboleda rodea el punto donde empieza Mateo en la historia del SMS («El mensaje en espera»):
         entre los árboles no tiene señal y camina hacia el claro, que queda despejado. Nunca sobre el camino de tierra, las casas ni delante de la cámara. */
      function plantCityTrees(vereda) {
        vereda.traverse(function (o) { if (o !== vereda && RURAL.tree.test(o.name || "")) o.visible = false; });
        loadCity(THREE).then(function (csrc) {
          var kinds = csrc.children.filter(function (c) { return /^ARBOL_/.test(c.name || ""); }); if (!kinds.length) return;
          group.updateMatrixWorld(true);
          /* lo que hay que evitar, en el plano del suelo (x, z) de la escena */
          var path = [], boxes = [], v = new THREE.Vector3();
          vereda.traverse(function (o) {
            if (!o.isMesh) return;
            var n = (o.name || "") + " " + (o.parent && o.parent.name || "");
            if (/Camino_Tierra/.test(n)) { var p = o.geometry.attributes.position; for (var i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); path.push([v.x, v.z]); } }
          });
          vereda.children.forEach(function (c) { if (/^(Casa_|Muros|Techo|Losa|Pilar|Viga)/.test(c.name || "")) boxes.push(new THREE.Box3().setFromObject(c)); });
          var W = RURAL.walk, placed = [], K = RURAL.scale / 2.6;   // K: cuánto creció el escenario (las distancias del potrero y el tamaño de sus árboles crecen igual)
          /* r: radio de la copa (los árboles no se juntan); con las casas y el camino solo cuenta el tronco (trunk), así la copa puede asomar sobre un techo */
          function free(x, z, r, trunk) {
            var cx = x - W.to[0], cz = z - W.to[1];
            if (cx * cx + cz * cz < 3.6 * 3.6) return false;                                // el claro adonde llega Mateo: ninguna copa encima
            if (z > -1 && Math.abs(x - 1) < 12 * K) return false;                           // cerca de la cámara: taparía a Mateo y la escena
            if (x > W.to[0] - 2.5 && x < W.to[0] + 2.5 && z > -22 * K) return false;                         // detrás del claro (visto desde la cámara): cielo abierto, se nota que ahí no hay árboles
            for (var i = 0; i < path.length; i++) { var dx = path[i][0] - x, dz = path[i][1] - z; if (dx * dx + dz * dz < (trunk + 1) * (trunk + 1)) return false; }
            for (var j = 0; j < boxes.length; j++) { var b = boxes[j]; if (x > b.min.x - trunk && x < b.max.x + trunk && z > b.min.z - trunk && z < b.max.z + trunk) return false; }
            for (var k = 0; k < placed.length; k++) { var q = placed[k]; if (Math.hypot(q[0] - x, q[1] - z) < q[2] + r) return false; }
            return true;
          }
          var seed = 20261031; function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }   // azar con semilla: el mismo bosque en cada visita
          var round = kinds.filter(function (c) { return /^ARBOL_1[13]$/.test(c.name); });   // copa redonda y baja: la arboleda de Mateo (los altos se verían solo como un tronco)
          if (!round.length) round = kinds;
          function plant(x, z, s, list) {
            list = list || kinds;
            var src = list[Math.floor(rnd() * list.length)], t = src.clone(true), g = new THREE.Group();
            t.position.set(0, 0, 0); t.rotation.y = rnd() * Math.PI * 2; g.add(t); g.scale.setScalar(s); g.position.set(x, 0, z);
            rShaded = rShaded.concat(toonize(g, M, X.envMat, function () { return false; }, false));
            group.add(g); swayers.push({ g: g, h: 4, ph: x * 0.7 });
            /* sombra bajo la copa: una mancha suave en el suelo del tamaño de la copa (como la sombra bajo los pies de Mateo). La luz que proyecta
               sombras solo cubre al personaje; una sombra real de cada árbol costaría mucho en celulares. */
            var cb = new THREE.Box3().setFromObject(g), sz = cb.getSize(new THREE.Vector3()), cc = cb.getCenter(new THREE.Vector3());
            var sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1;
            sh.scale.set(sz.x * 1.3, sz.z * 1.3, 1); sh.position.set(cc.x, 0.012, cc.z); group.add(sh);   // algo más ancha que la copa: desde la cámara se ve asomar alrededor del tronco
          }
          /* textura de la sombra: oscura en el centro, se desvanece hacia el borde (el alfa máximo, 0,55, ya incluye la opacidad) */
          var shc = document.createElement("canvas"); shc.width = shc.height = 128;
          var shx = shc.getContext("2d"), shg = shx.createRadialGradient(64, 64, 0, 64, 64, 64);
          shg.addColorStop(0, "rgb(140,140,140)"); shg.addColorStop(0.6, "rgb(115,115,115)"); shg.addColorStop(1, "rgb(0,0,0)"); shx.fillStyle = shg; shx.fillRect(0, 0, 128, 128);
          var shadowGeo = new THREE.PlaneGeometry(1, 1);
          var shadowMat = X.envMat(new THREE.MeshBasicMaterial({ color: 0x0c1a08, alphaMap: new THREE.CanvasTexture(shc), depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
          /* dos árboles junto al inicio de la caminata: uno justo a la izquierda de Mateo y un poco detrás (su copa y su sombra lo cubren) y otro más a
             la izquierda, separado para que las copas no se toquen. Mateo empieza a la sombra y camina a la derecha hacia el claro, donde no hay ninguno.
             Puntos fijos, elegidos mirando el escenario desde arriba: en el pasto, delante del camino de tierra (no se usa free(): está pensado para el
             resto del potrero y no deja árboles tan cerca de la cámara). */
          [[-1.8, -0.9], [-9.2, 0.0]].forEach(function (o) {   // separados ~7,5: con este tamaño las copas (radio ≈ 3,7) no se tocan
            var x = W.from[0] + o[0], z = W.from[1] + o[1], gs = 1.55 + rnd() * 0.1;
            placed.push([x, z, 2.5 * gs]); plant(x, z, gs, round);
          });
          /* el resto, repartido por el potrero (detrás y a los lados) */
          for (var tries2 = 0, m = 0; tries2 < 800 && m < 11; tries2++) {
            var x2 = (-19 + rnd() * 38) * K, z2 = (-19 + rnd() * 21) * K, s2 = (1.35 + rnd() * 0.5) * K, r2 = 2.5 * s2;   // r2: radio de la copa (los árboles miden ~4,5 m de ancho): sin copas encimadas
            if (!free(x2, z2, r2, 1.2 * K)) continue;
            placed.push([x2, z2, r2]); plant(x2, z2, s2); m++;
          }
          rTint();
        }).catch(function (err) { console.error("Árboles de Cali en la zona rural:", err); vereda.traverse(function (o) { if (RURAL.tree.test(o.name || "")) o.visible = true; }); });   // si no cargan, vuelven los frutales
      }
      var out = {
        sky: skyT, fog: [26, 80], far: 300, wide: RURAL.wide, charScale: RURAL.charScale,
        setNight: function (v) { night = !!v; rTint(); if (land) land.night(night); },
        update: function (t, amp) { clouds.forEach(function (c, i) { c.position.x += 0.0025 * (1 + i * 0.3); if (c.position.x > 28) c.position.x = -28; }); if (land) land.update(night); shake(t, amp); }
      };
      return out;
    }
    /* Paisaje de la vereda: la ilustración LAND.src (montañas, árboles y la casa) en un plano vertical detrás de Mateo, sin su cielo gris
       (se quita como en la tarjeta de la zona, js/card-art.js), así detrás de las montañas se ve el cielo de la escena.
       · Encuadre (fit): se calcula con la cámara del plano completo, como un «cover»: la ilustración cubre todo el ancho visible, la casa queda
         a la izquierda de Mateo (sin tamaño mínimo arbitrario), sus pies pisan el pasto de la imagen y las cimas no se salen por arriba.
       · Bordes: a los lados la textura se refleja (repetición en espejo) solo lo justo; debajo, una franja del pasto inferior se refleja hacia
         abajo (apron), así nunca queda un hueco aunque la cámara se acerque o baje en las transiciones. Sin filtros ni cambios de color.
       · El suelo de la escena se oculta (taparía el pasto pintado); en su lugar un plano invisible recibe la sombra del personaje y, de noche,
         la luz de la linterna. */
    function ruralLand(X) {
      var LAND = { src: "assets/scenes/cauca-paisaje.webp", z: -12, ratio: 1.6,
        house: [0.145, 0.393],   // borde izquierdo y derecho del techo de la casa (fracción del ancho)
        houseBase: 0.17, peak: 0.885, feet: 0.08, strip: 0.06, mirror: 0.04 };   // strip: solo el pasto bajo la casa del frente (su base llega a 0,08 del alto)   // alturas desde abajo (fracción del alto): base de la casa, cima más alta, pies de Mateo; franja de pasto del apron; espejo lateral máximo (el árbol de la derecha termina a 0,955: más espejo lo duplicaría)
      var landMat = X.envMat(new THREE.MeshBasicMaterial({ color: 0xffffff })), apronMat = X.envMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
      var APRON_ROWS = 24, landMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), landMat), apron = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, APRON_ROWS), apronMat);
      landMesh.visible = apron.visible = false; group.add(landMesh); group.add(apron);
      /* sombra del personaje y luz de la linterna sobre el pasto pintado */
      var shadowMat = new THREE.ShadowMaterial({ opacity: 0 }), catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), shadowMat);
      catcher.rotation.x = -Math.PI / 2; catcher.position.z = 6; catcher.receiveShadow = true; group.add(catcher);
      var fade = document.createElement("canvas"); fade.width = fade.height = 128;
      var fg = fade.getContext("2d"), gr = fg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "#fff"); gr.addColorStop(0.55, "#888"); gr.addColorStop(1, "#000"); fg.fillStyle = gr; fg.fillRect(0, 0, 128, 128);
      var glowMat = X.envMat(new THREE.MeshLambertMaterial({ color: 0x2a4a22, map: new THREE.CanvasTexture(fade), blending: THREE.AdditiveBlending, depthWrite: false })), glow = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), glowMat);
      glow.rotation.x = -Math.PI / 2; glow.position.set(0.5, 0.005, 0); glow.visible = false; group.add(glow);   // se desvanece en los bordes: sin línea donde termina
      if (X.ground) X.ground.visible = false;
      var last = null, tmp = new THREE.PerspectiveCamera(), v = new THREE.Vector3();

      function tex(canvas, wrapT) { var t = new THREE.CanvasTexture(canvas); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = wrapT; t.anisotropy = 4; return t; }
      function ready(img) {
        var w = img.naturalWidth, h = img.naturalHeight; LAND.ratio = w / h;
        var c = document.createElement("canvas"); c.width = 2048; c.height = 1024; c.getContext("2d").drawImage(img, 0, 0, 2048, 1024);   // potencia de dos: permite la repetición en espejo también en WebGL 1
        var s = document.createElement("canvas"); s.width = 2048; s.height = 256; s.getContext("2d").drawImage(img, 0, h * (1 - LAND.strip), w, h * LAND.strip, 0, 0, 2048, 256);
        landMat.map = tex(c, THREE.ClampToEdgeWrapping); apronMat.map = tex(s, THREE.MirroredRepeatWrapping); landMat.needsUpdate = apronMat.needsUpdate = true;
        landMesh.visible = apron.visible = true; if (last) fit.apply(null, last);
      }
      function load(src) { var img = new Image(); img.onload = function () { ready(img); }; img.onerror = function (e) { console.error("Paisaje rural:", e); }; img.src = src; }
      if (window.FFCardArt) window.FFCardArt.key(LAND.src).then(load).catch(function (err) { console.error("Paisaje rural (cielo):", err); load(LAND.src); });
      else load(LAND.src);

      /* rectángulo vertical en z = LAND.z con sus coordenadas de textura */
      function rect(m, x0, x1, y0, y1, u0, u1, v0, v1) {
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, LAND.z); m.scale.set(x1 - x0, y1 - y0, 1);
        var uv = m.geometry.attributes.uv; uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
      }
      /* punto del plano del paisaje en la línea de la cámara a p (mundo) */
      function toPlane(p) { v.copy(p).sub(tmp.position); var k = (LAND.z - tmp.position.z) / v.z; return { x: tmp.position.x + v.x * k, y: tmp.position.y + v.y * k }; }
      function fit(cam, fov, aspect) {
        last = [cam, fov, aspect];
        tmp.fov = fov; tmp.aspect = aspect; tmp.near = 0.1; tmp.far = 100; tmp.updateProjectionMatrix();
        tmp.position.copy(cam.p); tmp.lookAt(cam.l); tmp.updateMatrixWorld();
        var L = Infinity, R = -Infinity, B = Infinity, T = -Infinity;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (n) { var q = toPlane(new THREE.Vector3(n[0], n[1], 0.5).unproject(tmp)); L = Math.min(L, q.x); R = Math.max(R, q.x); B = Math.min(B, q.y); T = Math.max(T, q.y); });
        var w = R - L, h = T - B, feet = toPlane(new THREE.Vector3(0, 0, 0)), side = toPlane(new THREE.Vector3(-1.0, 0.8, 0));   // side: borde izquierdo de Mateo a la altura de la casa
        var hw = LAND.house[1] - LAND.house[0], hx = L + 0.015 * w;
        var W = Math.max((side.x - 0.01 * w - hx) / hw, (R - hx) / (1 - LAND.house[0] + LAND.mirror));   // la casa cabe a la izquierda de Mateo; a la derecha, a lo sumo LAND.mirror de espejo
        var H = W / LAND.ratio, x0 = hx - LAND.house[0] * W;
        var y0 = Math.min(feet.y - LAND.feet * H, T - 0.05 * h - LAND.peak * H);   // pies sobre el pasto; las cimas dentro del cuadro
        y0 = Math.max(y0, feet.y - (LAND.houseBase - 0.04) * H, B + 0.03 * h - LAND.houseBase * H);   // la casa queda detrás de Mateo (su base, más arriba que sus pies) y siempre a la vista
        var xa = Math.min(x0, L - 0.15 * w), xb = Math.max(x0 + W, R + 0.15 * w);   // margen para las transiciones de cámara
        rect(landMesh, xa, xb, y0, y0 + H, (xa - x0) / W, (xb - x0) / W, 0, 1);
        var drop = (y0 - B) + 0.8 * h;
        rect(apron, xa, xb, y0 - drop, y0, (xa - x0) / W, (xb - x0) / W, 0, 0);
        /* apron: el pasto se agranda hacia abajo (como si estuviera más cerca), así el reflejo no forma franjas iguales */
        var uv = apron.geometry.attributes.uv, k = 5, u0 = (xa - x0) / W, u1 = (xb - x0) / W;
        for (var j = 0; j <= APRON_ROWS; j++) { var dv = -Math.log(1 + k * (j / APRON_ROWS) * drop / H) / (k * LAND.strip); uv.setXY(j * 2, u0, dv); uv.setXY(j * 2 + 1, u1, dv); }
        uv.needsUpdate = true;
      }
      return {
        fit: fit,
        night: function (on) { var c = on ? 0x6f7690 : 0xffffff; landMat.color.setHex(c); apronMat.color.setHex(c); glow.visible = on; },
        update: function (on) { shadowMat.opacity = 0.32 * landMat.opacity * (on ? 0.35 : 1); }
      };
    }
    /* sismo: lo que oscila (casas, edificios, árboles, postes) gira un poco desde su base; lo que vibra (vehículos, cerca, objetos) se desplaza a los lados */
    function shake(t, amp) {
      var a = amp || 0;
      swayers.forEach(function (s) { s.g.rotation.z = a * Math.sin(t * 5.2 + s.ph) * 0.012 * (1 + s.h * 0.06); s.g.rotation.x = a * Math.sin(t * 4.1 + s.ph * 1.7) * 0.006; });
      jitter.forEach(function (m, i) { m.position.x += (a * Math.sin(t * 31 + i * 2.1) * 0.012 - (m.userData.dx || 0)); m.userData.dx = a * Math.sin(t * 31 + i * 2.1) * 0.012; });
    }

    /* ---------------- urbano: Cali ----------------
       Fondo: el escenario modelado en Blender (CITY.file). Mientras carga solo se ve el cielo; si no se puede cargar, se usa la ciudad genérica de abajo. */
    var skyU = skyTexture(THREE, [[0, "#6a5d8c"], [0.45, "#d98b8f"], [0.8, "#f6c28b"], [1, "#fbe1b0"]]);
    var S = CITY.scale;
    if (X.bg) { X.bg.position.set(0, 40, -150); X.bg.scale.setScalar(4); }
    X.status && X.status("loading");
    loadCity(THREE).then(function (src) { placeCity(src); X.status && X.status("ready"); }).catch(function (err) {
      console.error("Escenario urbano (GLB):", err); X.status && X.status("error");
      if (X.bg) { X.bg.position.set(0, 14, -30); X.bg.scale.setScalar(1); }
      if (out) out.wide = null;   // la ciudad genérica usa la cámara de siempre
      genericCity();
    });
    /* el toon shader no usa las luces de la escena: de noche (linterna) sus colores se oscurecen y enfrían para que la ciudad no se vea a plena luz */
    var shaded = [], night = false, NIGHT = new THREE.Color(0.26, 0.28, 0.38);
    function nightTint() { shaded.forEach(function (m) { m.color.copy(m.userData.base); if (night) m.color.multiply(NIGHT); }); }
    function placeCity(src) {
      var city = src.clone(true);   // la copia comparte geometrías con el modelo en caché; los materiales son propios de esta escena
      city.scale.setScalar(S); city.position.set(-CITY.at[0] * S, 0, -CITY.at[1] * S);
      city.children.forEach(function (node) {
        var name = node.name || "";
        /* sismo: edificios, casas, árboles y postes oscilan desde su base; vehículos y objetos de la calle vibran */
        if (/^(EDIFICIO|CASA|ARBOL|POSTE)_/.test(name)) { var h = new THREE.Box3().setFromObject(node).getSize(new THREE.Vector3()).y; swayers.push({ g: node, h: Math.min(h, 8), ph: node.position.x * 0.7 }); }
        else if (/^(BUS|TAXI|PARADERO|GATO|INSTRUMENTO)_/.test(name)) jitter.push(node);
      });
      /* mismo toon shader (Substance) que el teléfono, la radio y la linterna. La calle y el andén no: el shader ilumina desde la cámara y el suelo,
         visto casi de canto, caería en su escalón negro; ahí queda el material toon con la luz de la escena (y recibe la sombra de la chica). */
      shaded = toonize(city, M, X.envMat, function (o) { for (var p = o; p && p !== city; p = p.parent) if (/^CALLE_/.test(p.name || "")) return true; return false; });
      group.add(city); nightTint();
      /* calle más ancha hacia la cámara: asfalto con el mismo material de la calzada del modelo, desde su borde delantero */
      var road = null; city.traverse(function (o) { if (!road && o.isMesh && /CALLE_Calzada/.test(o.parent && o.parent.name || "") || (!road && o.isMesh && /CALLE_Calzada/.test(o.name))) road = o; });
      if (road && CITY.roadAhead) {
        city.updateMatrixWorld(true); var rb = new THREE.Box3().setFromObject(road), L = CITY.roadAhead * S;
        var ahead = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), road.material); ahead.rotation.x = -Math.PI / 2; ahead.receiveShadow = true;
        ahead.scale.set(rb.max.x - rb.min.x, L, 1); ahead.position.set((rb.min.x + rb.max.x) / 2, -0.004, rb.max.z + L / 2 - 0.02); group.add(ahead);
      }
      /* suelo lejano bajo el modelo (se ve entre los edificios del fondo, hasta el horizonte) */
      var far = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(CITY.farGround)); far.rotation.x = -Math.PI / 2; far.scale.set(900, 700, 1); far.position.set(0, -0.25 * S, -250); group.add(far);
      if (X.ground) X.ground.visible = false;   // el suelo genérico de la escena se reemplaza por la calle y el andén del modelo
    }
    function genericCity() {
    function winTex(w, h, lit) {
      var c = document.createElement("canvas"); c.width = 64; c.height = 128; var g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 64, 128);
      for (var y = 0; y < 8; y++) for (var x = 0; x < 4; x++) { g.fillStyle = (x * 3 + y * 5 + lit) % 7 === 0 ? "#f6d98a" : "#4b5670"; g.fillRect(6 + x * 15, 8 + y * 15, 9, 9); }
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w, h); return t;
    }
    function building(x, z, w, h, d, color, lit) {
      var g = new THREE.Group(); g.position.set(x, 0, z); group.add(g);
      var m = X.envMat(M.toon(color, { map: winTex(Math.max(1, Math.round(w / 1.1)), Math.max(1, Math.round(h / 1.6)), lit) }));
      var b = new THREE.Mesh(box, m); b.position.y = h / 2; b.scale.set(w, h, d); g.add(b);
      add(g, box, 0x7a7378, 0, h + 0.08, 0, w * 1.04, 0.16, d * 1.04);
      swayers.push({ g: g, h: h, ph: x * 0.7 }); return g;
    }
    var cols = [0xd9b99b, 0xb8c5d6, 0xe3c9c0, 0xc9b6d9, 0x9fb7a4, 0xe6d2a0];
    [[-17, -12, 3, 8, 3], [-13.2, -10, 2.6, 5.5, 2.6], [-7.6, -12, 3.2, 9.5, 3], [-3.4, -14, 2.8, 7, 3], [2.6, -13, 3, 10.5, 3], [7.6, -11, 2.6, 6, 2.6], [11.6, -13, 3.2, 8.5, 3], [16.6, -12, 3, 6.5, 3]].forEach(function (b, i) { building(b[0], b[1], b[2], b[3], b[4], cols[i % cols.length], i); });
    building(-6.6, -4.2, 2.6, 3.2, 2.2, 0xe3c9c0, 3); building(6.8, -4.6, 2.8, 4.2, 2.4, 0xc9d3b9, 5);
    /* torre con tejado en punta y balcón */
    var tower = new THREE.Group(); tower.position.set(-10.2, 0, -8); group.add(tower);
    add(tower, box, 0xf1e6d2, 0, 3, 0, 1.7, 6, 1.7); add(tower, cone4, 0xa84a3a, 0, 6.9, 0, 1.4, 1.8, 1.4, Math.PI / 4); add(tower, box, 0x7a4a2c, 0, 0.8, 0.86, 0.7, 1.4, 0.05); add(tower, box, 0x3d4a5a, 0, 4.2, 0.86, 0.5, 0.9, 0.05); add(tower, box, 0x7a7378, 0, 3.2, 1.0, 1.6, 0.08, 0.5);
    swayers.push({ g: tower, h: 6, ph: 2 });
    /* calle: andén, líneas y objetos */
    add(group, box, 0xb9b3a8, 0, 0.06, -3.1, 36, 0.12, 1.7);
    var dash = new THREE.InstancedMesh(box, mat(0xf3eadb), 11), dm = new THREE.Object3D();
    for (var q = 0; q < 11; q++) { dm.position.set(-15 + q * 3, 0.015, 3.4); dm.scale.set(1.3, 0.02, 0.14); dm.updateMatrix(); dash.setMatrixAt(q, dm.matrix); }
    group.add(dash);
    var bulb = X.envMat(new THREE.MeshBasicMaterial({ color: 0xfff2b8 }));
    [-3.4, 3.8].forEach(function (x, i) {
      var g = new THREE.Group(); g.position.set(x, 0, -2.6); group.add(g);
      add(g, cyl, 0x4a4650, 0, 1.6, 0, 0.06, 3.2, 0.06); add(g, box, 0x4a4650, 0.3, 3.2, 0, 0.7, 0.07, 0.07); var l = add(g, sph, bulb, 0.6, 3.12, 0, 0.14, 0.1, 0.14); lamps.push(l); swayers.push({ g: g, h: 3, ph: i });
    });
    [[5.6, -2.4], [-6.0, -1.8]].forEach(function (p, i) {   // palmas
      var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); group.add(g);
      var tr = add(g, cyl, 0x8a6a4a, 0, 1.4, 0, 0.12, 2.8, 0.12); tr.rotation.z = i ? 0.1 : -0.08;
      for (var k = 0; k < 6; k++) { var lf = add(g, cone4, 0x3f8a4a, Math.cos(k * 1.05) * 0.5 + (i ? 0.28 : -0.22), 2.85, Math.sin(k * 1.05) * 0.5, 0.18, 1.2, 0.5); lf.rotation.set(Math.sin(k * 1.05) * 1.1, 0, -Math.cos(k * 1.05) * 1.1); }
      swayers.push({ g: g, h: 2.8, ph: 1 + i });
    });
    var cone1 = add(group, cone, 0xe0662b, 2.2, 0.28, -1.8, 0.2, 0.56, 0.2); add(group, box, 0xf3eadb, 2.2, 0.03, -1.8, 0.4, 0.06, 0.4); jitter.push(cone1);
    var bin = add(group, box, 0x4f7a5a, -1.8, 0.35, -2.2, 0.5, 0.7, 0.45); jitter.push(bin); var crate = add(group, box, 0xc8a46a, -4.4, 0.25, -1.6, 0.5, 0.5, 0.5); jitter.push(crate);
    }
    var out;
    return out = {
      sky: skyU, far: 600, fog: [40, 230], wide: CITY.wide,
      setNight: function (v) { night = !!v; nightTint(); },
      update: function (t, amp) {
        var a = amp || 0;
        shake(t, a);
        lamps.forEach(function (l, i) { l.material.color.setHex(a > 0.05 && Math.sin(t * 24 + i) > 0.2 ? 0xc8b680 : 0xfff2b8); });
      }
    };
  }

  return { build: build, preload: function (zone) { if (!window.THREE) return; loadGLB(window.THREE, zone === "rural" ? RURAL.file : CITY.file).catch(function () {}); } };
})();
