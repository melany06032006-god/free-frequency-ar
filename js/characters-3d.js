/* Original GLB geometry/textures + lightweight rigid joints (the supplied files
   have no skeleton or animation clips). No baked lighting or PNG billboards. */
window.FFCharacters = (function () {
  "use strict";
  var files = { rural: "assets/models/rural/chicorural/chico_rural.glb", urbano: "assets/models/urbano/chicacaleña/chica_calena.glb" };
  function dispose(root) {
    var geometries = new Set(), materials = new Set(), textures = new Set();
    root.traverse(function (o) { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { materials.add(m); Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) textures.add(m[k]); }); }); });
    geometries.forEach(function (g) { g.dispose(); }); materials.forEach(function (m) { m.dispose(); }); textures.forEach(function (t) { if (t.image && t.image.close) t.image.close(); t.dispose(); });
  }
  var Y = new THREE.Vector3(0, 1, 0);
  /* centro de un ojo en el mundo: si la malla tiene varias piezas (ojo + párpado), se toma la más pequeña, que es el ojo (igual que en js/home-chars.js) */
  function eyeCenter(m) {
    var g = m.geometry, p = g.attributes.position, idx = g.index ? g.index.array : null, n = p.count, par = new Int32Array(n), i;
    for (i = 0; i < n; i++) par[i] = i;
    function f(a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }
    function u(a, b) { a = f(a); b = f(b); if (a !== b) par[a] = b; }
    if (idx) for (i = 0; i < idx.length; i += 3) { u(idx[i], idx[i + 1]); u(idx[i], idx[i + 2]); }
    var key = {}; for (i = 0; i < n; i++) { var k = p.getX(i).toFixed(4) + "," + p.getY(i).toFixed(4) + "," + p.getZ(i).toFixed(4); if (key[k] !== undefined) u(i, key[k]); else key[k] = i; }
    var groups = {}; for (i = 0; i < n; i++) { var rt = f(i); (groups[rt] = groups[rt] || []).push(i); }
    var best = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return a.length - b.length; })[0];
    var box = new THREE.Box3(), v = new THREE.Vector3();
    best.forEach(function (j) { box.expandByPoint(v.fromBufferAttribute(p, j)); });
    return box.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld);
  }
  /* hacia dónde mira el ojo: el promedio de las normales de su malla (la superficie de la cara en ese punto) */
  function eyeNormal(m, c, hc) {
    var nr = m.geometry.attributes.normal, sum = new THREE.Vector3(), v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    if (nr) for (var i = 0; i < nr.count; i++) sum.add(v.fromBufferAttribute(nr, i));
    if (!nr || sum.lengthSq() < 1e-6) return c.clone().sub(hc).normalize();
    sum.applyMatrix3(nm).normalize(); if (sum.z < 0) sum.negate(); return sum;
  }
  /* mano izquierda (la que sostiene el objeto): dirección del brazo, giro sobre su eje (para orientar la palma) y cuánto se cierran los dedos */
  var HOLD = {
    phone: { d: [.3, -.35, .8], roll: Math.PI, curl: 1.1 },             // los dedos quedan detrás del teléfono (no lo atraviesan ni tapan la pantalla); ver el apoyo en js/seq-modules.js
    llamadas: { d: [.55, .6, .3], roll: Math.PI, curl: 1.1 },           // el teléfono junto a la cabeza; la mano lo sostiene por detrás (antes lo agarraba por el borde y los dedos asomaban delante)
    cobertura: { d: [.45, .8, .35], roll: Math.PI, curl: 1.1 },         // el teléfono en alto, sostenido por detrás
    radio: { d: [.2, -1, .38], palm: [0, -.2, -1], curl: 1.55 },        // brazo colgando un poco adelantado, palma hacia atrás y dedos en gancho: el asa queda dentro de la mano
    torch: { d: [.25, -.95, -.15], palm: [-.68, -.28, .64], curl: 1.45 } // brazo colgando: el hueco del puño (línea de los nudillos) apunta hacia delante y hacia fuera, y el mango pasa por él (ver js/seq-modules.js)
  };
  /* ajustes por personaje. Valeria: su pantalón es muy ancho y con el brazo casi vertical la radio, que cuelga del asa bajo la mano, quedaba metida en el
     muslo (≈0,3 unidades). Con el brazo algo más adelantado la radio cuelga delante de la pierna, con un espacio visible, y el asa sigue dentro de la mano. */
  /* Valeria: el brazo cuelga hacia abajo como el de Mateo (así su mano se ve cerrada en puño sobre el asa) pero un poco abierto hacia el costado,
     para que la radio quede fuera de su pantalón ancho (medido: ningún punto de la radio dentro de la pierna). Antes iba muy adelantado
     ([.22, -1, 1.05]) y, visto de frente, la mano parecía abierta y colgando. */
  /* Mateo, linterna: con el brazo colgando la mano quedaba dentro de su bolso tejido (a la izquierda, a la altura de la cadera). El brazo va adelantado
     y la palma hacia abajo: la mano queda por delante del bolso y la linterna apunta hacia fuera, de perfil. */
  /* pinza de la mano libre: [nudillo, articulación media, articulación de la punta] en radianes, por dedo */
  var PINCH = { thumb: [.45, .5, .4], index: [.65, .8, .6], rest: [1.35, 1.2, 1.0] };
  /* brazo que sostiene, levantado hacia delante y hacia el centro (api.holdLift): la radio queda frente al pecho, donde también llega la otra mano
     (los brazos no tienen codo: las dos manos se encuentran a un largo de brazo de cada hombro, delante y un poco abajo del pecho) */
  var HOLD_LIFT = { d: [-.3, -.42, .86], palm: [-.3, -.2, -1] };
  var HOLD_ZONE = { urbano: { radio: { d: [.7, -1, .4], palm: [0, -.2, -1], curl: 1.55 } }, rural: { torch: { d: [.25, -.8, .55], palm: [-.19, -.6, -.78], curl: 1.45 } } };  function load(zone, parent) {
    return new Promise(function (resolve, reject) {
      new THREE.GLTFLoader().load(files[zone], function (gltf) {
        // Both exports contain an unrelated second scene with a default cube.
        var model = gltf.scenes.find(function (s) { return s.name.indexOf("modelo") !== -1; }) || gltf.scene;
        gltf.scenes.forEach(function (s) { if (s !== model) dispose(s); });
        var holder = new THREE.Group(); holder.name = "Character3D_" + zone; holder.add(model);
        model.updateMatrixWorld(true);
        var head; model.traverse(function (o) { if (/Cabeza$/i.test(o.name)) head = o; });
        var bounds = new THREE.Box3().setFromObject(model), scale = 4.4 / (bounds.max.y - bounds.min.y);
        var cx = head ? head.getWorldPosition(new THREE.Vector3()).x : bounds.getCenter(new THREE.Vector3()).x;
        model.scale.multiplyScalar(scale); model.position.add(new THREE.Vector3(-cx * scale, -bounds.min.y * scale, 0));
        holder.updateMatrixWorld(true);
        var ramp = new THREE.DataTexture(new Uint8Array([65, 155, 255]), 3, 1, THREE.RedFormat);
        ramp.magFilter = ramp.minFilter = THREE.NearestFilter; ramp.generateMipmaps = false; ramp.needsUpdate = true;
        ramp.name = "Toon: sombra / medio tono / luz";
        var materials = new Map(), skin, shirt;
        function toon(source) {
          if (materials.has(source)) return materials.get(source);
          var m = new THREE.MeshToonMaterial({ color: source.color ? source.color.clone() : 0xffffff, map: source.map || null, gradientMap: ramp });
          ["alphaMap", "alphaTest", "opacity", "transparent", "side", "depthWrite", "normalMap", "normalMapType", "bumpMap", "bumpScale", "displacementMap", "displacementScale", "displacementBias", "aoMap", "aoMapIntensity", "emissiveMap", "emissiveIntensity"].forEach(function (key) { if (source[key] !== undefined) m[key] = source[key]; });
          if (source.normalScale) m.normalScale.copy(source.normalScale);
          if (source.emissive) m.emissive.copy(source.emissive);
          m.name = source.name; m.userData.baseOpacity = m.opacity; m.userData.baseTransparent = m.transparent;
          if (/Piel/i.test(m.name)) skin = m;
          if (/Camisa a cuadros|Blusa/i.test(m.name)) shirt = m;
          materials.set(source, m); return m;
        }
        model.traverse(function (o) { if (!o.isMesh) return; o.material = Array.isArray(o.material) ? o.material.map(toon) : toon(o.material); o.castShadow = o.receiveShadow = true; });
        materials.forEach(function (_, source) { source.dispose(); });
        // Reparent whole arm pieces around shoulder pivots, retaining their
        // world transforms, original geometry, UVs and texture references.
        /* huesos de los dedos: cada dedo del modelo es una pieza entera; aquí se vuelve una malla con tres huesos (nudillo, mitad y cerca de la punta)
           para que se doble por sus articulaciones. El nudillo sigue girando con el grupo del dedo (f.g), como siempre; las articulaciones (f.joints)
           giran sobre el mismo eje y empiezan rectas, así todo queda igual salvo cuando se piden (p. ej. la pinza para tomar la antena). */
        function skinFinger(f) {
          holder.updateMatrixWorld(true);
          var g = f.g, meshes = [], v = new THREE.Vector3(), pts = [], c = new THREE.Vector3();
          g.traverse(function (o) { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
          if (!meshes.length) return;
          meshes.forEach(function (m) { var p = m.geometry.attributes.position; for (var i = 0; i < p.count; i += 2) { var w = g.worldToLocal(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)).clone(); pts.push(w); c.add(w); } });
          c.multiplyScalar(1 / pts.length);
          /* eje del dedo (del nudillo, en el origen de f.g, hacia la punta) y su largo, en el espacio de f.g */
          var cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], ax = new THREE.Vector3(1, .3, .2);
          pts.forEach(function (q) { var d = [q.x - c.x, q.y - c.y, q.z - c.z]; for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) cov[a][b] += d[a] * d[b]; });
          for (var k = 0; k < 60; k++) ax.set(cov[0][0] * ax.x + cov[0][1] * ax.y + cov[0][2] * ax.z, cov[1][0] * ax.x + cov[1][1] * ax.y + cov[1][2] * ax.z, cov[2][0] * ax.x + cov[2][1] * ax.y + cov[2][2] * ax.z).normalize();
          if (ax.dot(c) < 0) ax.negate();
          var L = 0; pts.forEach(function (q) { L = Math.max(L, q.dot(ax)); }); if (L <= 0) return;
          /* eje de la flexión: el mismo del nudillo (Y del padre de f.g), visto desde dentro de f.g (que además lleva f.base) */
          var bendG = new THREE.Vector3(0, 1, 0).applyQuaternion(f.base.clone().invert());
          f.joints = [];
          meshes.forEach(function (m) {
            var toM = function (p) { return m.worldToLocal(g.localToWorld(p.clone())); };
            var P0 = toM(new THREE.Vector3()), P1 = toM(ax.clone().multiplyScalar(.42 * L)), P2 = toM(ax.clone().multiplyScalar(.72 * L));
            var A = toM(ax.clone()).sub(P0), A2 = A.lengthSq(), bend = toM(bendG.clone()).sub(P0).normalize();
            var geo = m.geometry.clone(), pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
            var ss = function (e0, e1, x) { x = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return x * x * (3 - 2 * x); };
            for (var i = 0; i < n; i++) {
              var t = v.fromBufferAttribute(pos, i).sub(P0).dot(A) / (A2 * L), w1 = ss(.36, .48, t), w2 = ss(.66, .78, t);
              si[i * 4] = 0; si[i * 4 + 1] = 1; si[i * 4 + 2] = 2; si[i * 4 + 3] = 0;
              sw[i * 4] = 1 - w1; sw[i * 4 + 1] = w1 - w2; sw[i * 4 + 2] = w2; sw[i * 4 + 3] = 0;
            }
            geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
            var b0 = new THREE.Bone(), b1 = new THREE.Bone(), b2 = new THREE.Bone();
            b0.position.copy(P0); b1.position.copy(P1).sub(P0); b2.position.copy(P2).sub(P1); b0.add(b1); b1.add(b2);
            var sm = new THREE.SkinnedMesh(geo, m.material); sm.name = m.name; sm.position.copy(m.position); sm.quaternion.copy(m.quaternion); sm.scale.copy(m.scale);
            sm.castShadow = m.castShadow; sm.receiveShadow = m.receiveShadow; sm.frustumCulled = false; sm.add(b0);
            var par = m.parent; par.add(sm); par.remove(m); holder.updateMatrixWorld(true);
            sm.bind(new THREE.Skeleton([b0, b1, b2]));
            f.joints.push({ b1: b1, b2: b2, ax: bend });
          });
        }
        function arm(side) {
          var candidates = [], handPieces = [];
          model.traverse(function (o) { var n = o.name.toLowerCase(); if (/brazo|manga|mano|puño|pulsera/.test(n) && n.indexOf(side) !== -1) candidates.push(o); if (n.indexOf("mano") !== -1 && n.indexOf(side) !== -1) handPieces.push(o); });
          var roots = candidates.filter(function (o) { var p = o.parent; while (p) { if (candidates.indexOf(p) !== -1) return false; p = p.parent; } return true; });
          if (!roots.length) return null;
          var box = new THREE.Box3(); roots.forEach(function (o) { box.union(new THREE.Box3().setFromObject(o)); });
          var positive = side === "izquierd", x = positive ? box.min.x + .04 : box.max.x - .04, y = (box.min.y + box.max.y) / 2;
          /* Articulación del hombro: dentro de la manga abullonada, a ¾ de su radio desde el extremo interior (no en ese extremo, que queda
             metido en el torso junto al cuello). Así, al bajar el brazo, la manga gira sobre sí misma y se queda a la altura del hombro,
             en vez de colgar desde el pecho y dejar el brazo saliendo a la altura de la cintura. */
          var sleeve = new THREE.Box3(); candidates.forEach(function (o) { if (/manga/i.test(o.name)) sleeve.union(new THREE.Box3().setFromObject(o)); });
          if (!sleeve.isEmpty()) { var R = (sleeve.max.y - sleeve.min.y) / 2; x = positive ? sleeve.min.x + .75 * R : sleeve.max.x - .75 * R; y = (sleeve.min.y + sleeve.max.y) / 2; }
          var pivot = new THREE.Group(); pivot.name = "Shoulder_" + side; pivot.position.set(x, y, 0); holder.add(pivot); holder.updateMatrixWorld(true);
          roots.forEach(function (o) { pivot.attach(o); });
          var hb = new THREE.Box3(); handPieces.forEach(function (o) { hb.union(new THREE.Box3().setFromObject(o)); });
          var grip = new THREE.Object3D(); grip.name = "Grip_" + side;
          var point = hb.isEmpty() ? box.getCenter(new THREE.Vector3()) : hb.getCenter(new THREE.Vector3());
          grip.position.copy(pivot.worldToLocal(point)); pivot.add(grip);
          /* cada dedo gira desde su nudillo (el extremo más cercano a la muñeca) para poder cerrar la mano sobre el objeto */
          var fingers = [];
          handPieces.forEach(function (o) {
            var b = new THREE.Box3().setFromObject(o), g = new THREE.Group();
            g.position.copy(pivot.worldToLocal(new THREE.Vector3(positive ? b.min.x : b.max.x, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2)));
            pivot.add(g); g.attach(o); fingers.push({ g: g, thumb: /pulgar/i.test(o.name), index: /índice|indice/i.test(o.name), base: new THREE.Quaternion() });
          });
          /* Mateo: sus dedos se abrían un poco en abanico. Cada dedo se alinea con el eje medio de los cuatro; la separación entre ellos queda
             como la del modelo, igual que en Valeria (≈3 veces el grosor del dedo; juntarlos más los hacía ver fusionados). En Valeria no se aplica. */
          if (zone === "rural") {
            holder.updateMatrixWorld(true);
            var axisOf = function (f) {   // eje principal del dedo y su centro, en el espacio del pivote del brazo
              var pts = [], c = new THREE.Vector3(), v = new THREE.Vector3(), cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], ax = new THREE.Vector3(1, .3, .2);
              f.g.children.forEach(function (m) { var p = m.geometry.attributes.position; for (var i = 0; i < p.count; i += 2) { var w = pivot.worldToLocal(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)).clone(); pts.push(w); c.add(w); } });
              c.multiplyScalar(1 / pts.length);
              pts.forEach(function (q) { var d = [q.x - c.x, q.y - c.y, q.z - c.z]; for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) cov[a][b] += d[a] * d[b]; });
              for (var k = 0; k < 60; k++) ax.set(cov[0][0] * ax.x + cov[0][1] * ax.y + cov[0][2] * ax.z, cov[1][0] * ax.x + cov[1][1] * ax.y + cov[1][2] * ax.z, cov[2][0] * ax.x + cov[2][1] * ax.y + cov[2][2] * ax.z).normalize();
              if (ax.dot(c.clone().sub(f.g.position)) < 0) ax.negate();   // del nudillo hacia la punta
              return { ax: ax, c: c };
            };
            var fs4 = fingers.filter(function (f) { return !f.thumb; }), mean = new THREE.Vector3();
            fs4.forEach(function (f) { f.ax = axisOf(f).ax; mean.add(f.ax); }); mean.normalize();
            fs4.forEach(function (f) { f.base.setFromUnitVectors(f.ax, mean); });   // sin abanico
          }
          fingers.forEach(skinFinger);
          /* muñeca: los cinco dedos cuelgan de un grupo en el centro de los nudillos, para girar la mano entera un poco (gestos) sin mover el brazo.
             El modelo no trae palma: la mano son los dedos. Sin giro, todo queda exactamente como antes. */
          var wrist = new THREE.Group(); wrist.name = "Wrist_" + side;
          if (fingers.length) { var wc = new THREE.Vector3(); fingers.forEach(function (f) { wc.add(f.g.position); }); wrist.position.copy(wc.multiplyScalar(1 / fingers.length)); }
          pivot.add(wrist); holder.updateMatrixWorld(true); fingers.forEach(function (f) { wrist.attach(f.g); });
          return { pivot: pivot, grip: grip, wrist: wrist, fingers: fingers, axis: new THREE.Vector3(positive ? 1 : -1, 0, 0), sign: positive ? 1 : -1 };
        }
        var left = arm("izquierd"), right = arm("derech"), headRest = head ? head.quaternion.clone() : null;
        /* postura de miedo (solo en el sismo, api.fear 0–1): el tronco, con los brazos y la cabeza, baja un poco y se inclina desde la cadera, y el pantalón
           se acorta desde el suelo, como si flexionara las rodillas (las piernas son piezas enteras, sin rodilla). Las zapatillas no cambian. Con fear = 0 todo
           queda exactamente como en el modelo. */
        var crouch = null;
        (function () {
          var body = null; model.traverse(function (o) { if (!body && o.children.length > 3) body = o; }); if (!body) return;
          var legs = [], upper = [];
          body.children.slice().forEach(function (o) { var n = o.name.toLowerCase(); if (/referencia/.test(n)) return; if (/pantal|pierna|jean|dobladillo/.test(n)) legs.push(o); else if (!/zapat|bota|calzado|suela/.test(n)) upper.push(o); });   // Valeria: pantalón; Mateo: jean y dobladillos (botas y suelas no se mueven)
          if (!legs.length || !upper.length) return;
          holder.updateMatrixWorld(true);
          var lb = new THREE.Box3(); legs.forEach(function (o) { lb.union(new THREE.Box3().setFromObject(o)); });
          var torso = new THREE.Group(); torso.name = "Torso_pivot"; torso.position.set(0, lb.max.y, 0); holder.add(torso);
          var hips = new THREE.Group(); hips.name = "Legs_pivot"; hips.position.set(0, lb.min.y, 0); holder.add(hips); holder.updateMatrixWorld(true);
          upper.forEach(function (o) { torso.attach(o); }); [left, right].forEach(function (a) { if (a) torso.attach(a.pivot); });
          legs.forEach(function (o) { hips.attach(o); });
          crouch = { torso: torso, hips: hips, y0: lb.max.y, legH: lb.max.y - lb.min.y };
        })();
        /* caminar (api.walk = { phase, k }): el modelo no trae esqueleto ni animaciones, así que cada pierna (pantalón, dobladillo, bota y suela de ese lado)
           se agrupa bajo una articulación en la cadera y gira hacia delante y hacia atrás, en sentidos opuestos. La pieza de la cadera (cruza el centro) y
           los bolsillos no se mueven. El brazo libre se balancea al revés que su pierna y el cuerpo baja exactamente lo que subirían los pies al girar la
           pierna, para que siempre pisen el suelo. Se arma la primera vez que se usa (Mateo, «Buscar un lugar con mejor señal»); en reposo no cambia nada. */
        var legRig = null;
        function buildLegs() {
          holder.updateMatrixWorld(true);
          /* medidas en el espacio del propio personaje (no del mundo): al empezar a caminar ya puede estar desplazado y girado */
          var toLocal = new THREE.Matrix4().copy(holder.matrixWorld).invert(), localBox = function (o) { return new THREE.Box3().setFromObject(o).applyMatrix4(toLocal); };
          var sides = { izquierd: [], derech: [] }, found = [];
          holder.traverse(function (o) {
            if (!o.isMesh) return; var n = o.name.toLowerCase();
            if (!/pierna|dobladillo|bota|suela|pantal|zapat/.test(n) || /bolsillo/.test(n)) return;
            var b = localBox(o), cx = (b.min.x + b.max.x) / 2; if (Math.abs(cx) < .08) return;
            found.push([o, cx > 0 ? "izquierd" : "derech"]);
          });
          found.forEach(function (f) { sides[f[1]].push(f[0]); });
          var legs = [];
          Object.keys(sides).forEach(function (k) {
            var parts = sides[k]; if (!parts.length) return;
            var b = new THREE.Box3(); parts.forEach(function (o) { b.union(localBox(o)); });
            var hip = new THREE.Group(); hip.name = "Hip_" + k; hip.position.set((b.min.x + b.max.x) / 2, b.max.y - .12, (b.min.z + b.max.z) / 2); holder.add(hip); holder.updateMatrixWorld(true);
            parts.forEach(function (o) { hip.attach(o); });
            legs.push({ g: hip, s: k === "izquierd" ? 1 : -1, L: hip.position.y });
          });
          return legs.length === 2 ? legs : [];
        }
        var dTmp = new THREE.Vector3();
        /* cuello: la cabeza (con su pelo, ojos, gafas y sombrero, que cuelgan de ella) gira desde su base, sobre el cuello, para asentir, negar o
           inclinarse sin despegarse. Antes giraba desde su centro. El punto sale de la malla de la cabeza sola (sin el pelo largo de Valeria). */
        var neck = null, headC = new THREE.Vector3();
        if (head) {
          holder.updateMatrixWorld(true);
          var hgeo = head.geometry; if (!hgeo.boundingBox) hgeo.computeBoundingBox();
          var hbx = hgeo.boundingBox.clone().applyMatrix4(head.matrixWorld); hbx.getCenter(headC);
          var npw = new THREE.Vector3(headC.x, hbx.min.y + .06 * (hbx.max.y - hbx.min.y), headC.z - .05 * (hbx.max.z - hbx.min.z)), nhost = crouch ? crouch.torso : holder;
          neck = new THREE.Group(); neck.name = "Neck_pivot"; neck.position.copy(nhost.worldToLocal(npw)); nhost.add(neck); holder.updateMatrixWorld(true); neck.attach(head);
        }
        /* cejas (solo Mateo las tiene): cada una gira desde su centro; con preocupación, el extremo de adentro sube */
        var brows = [];
        holder.updateMatrixWorld(true);
        holder.traverse(function (o) { if (o.isMesh && /Ceja/i.test(o.name)) brows.push(o); });
        brows = brows.map(function (o) { var c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()), g = new THREE.Group(); g.name = "Ceja_pivot"; o.parent.add(g); g.position.copy(o.parent.worldToLocal(c.clone())); holder.updateMatrixWorld(true); g.attach(o); return { g: g, dir: c.x < headC.x ? 1 : -1 }; });
        /* ojos de susto «> <» (solo en el sismo): dos trazos oscuros y gruesos en ángulo por ojo, con la punta hacia la nariz, pegados a la cara
           en el sitio de cada ojo original (que se oculta mientras se muestran) */
        var eyes = [], scared = [], happy = [], closed = [], eyeMode = "normal", Z = new THREE.Vector3(0, 0, 1), domeMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, fog: false });
        (function () {
          holder.updateMatrixWorld(true);
          holder.traverse(function (o) { if (o.isMesh && /(^|_)Ojo_/i.test(o.name)) eyes.push(o); });   // la cabeza ya cuelga del pivote del tronco
          if (!head || !eyes.length) return;
          var hc = new THREE.Box3().setFromObject(head).getCenter(new THREE.Vector3()), mat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
          var W = .2, H = .24, R = .03, L = Math.hypot(W, H / 2) + R * .6, up = new THREE.Vector3(0, 1, 0);
          var stroke = new THREE.CapsuleGeometry(R, L - 2 * R, 4, 10);
          eyes.forEach(function (eye) {
            var c = eyeCenter(eye), n = eyeNormal(eye, c, hc), dir = c.x < hc.x ? 1 : -1;   // ojo de la izquierda en pantalla: «>»; de la derecha: «<» (las puntas hacia la nariz)
            var x = new THREE.Vector3().crossVectors(up, n).normalize(), y = new THREE.Vector3().crossVectors(n, x);
            var g = new THREE.Group(); g.name = "Ojo_susto"; g.position.copy(c).addScaledVector(n, .035); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n));
            [1, -1].forEach(function (s) {   // trazo de arriba y de abajo, desde el extremo exterior hasta la punta
              var m = new THREE.Mesh(stroke, mat); m.position.set(0, s * H / 4, 0); m.rotation.z = Math.atan2(-s * H / 2, dir * W) - Math.PI / 2; g.add(m);
            });
            g.visible = false; eye.parent.attach(g); scared.push(g);
            /* parpadeo: el ojo se cambia un instante por una línea curva corta, en el mismo sitio y con el mismo trazo que los ojos de susto */
            var shut = new THREE.Group(); shut.name = "Ojo_cerrado"; shut.position.copy(c).addScaledVector(n, .035); shut.position.y -= .02; shut.quaternion.copy(g.quaternion);
            var ew = (zone === "urbano" ? .24 : .21), sm1 = new THREE.Mesh(new THREE.CapsuleGeometry(R * .85, ew - 2 * R, 4, 10), mat); sm1.rotation.z = Math.PI / 2; shut.add(sm1);
            shut.visible = false; eye.parent.attach(shut); closed.push(shut);
            /* ojos felices de la despedida: igual que en la portada (js/home-chars.js), medio círculo negro con el lado recto abajo, pegado a la cara */
            var r = .11 * (zone === "urbano" ? 1.13 : 1), dome = new THREE.Mesh(new THREE.CircleGeometry(r, 28, 0, Math.PI), domeMat);
            dome.name = "Ojo_feliz"; dome.position.copy(c).addScaledVector(n, .03).y -= r * .35; dome.quaternion.setFromUnitVectors(Z, n);
            dome.visible = false; eye.parent.attach(dome); happy.push(dome);
          });
        })();
        /* expresión: "normal" (ojos del modelo), "scared" (sismo) o "happy" (despedida). Solo cambia la visibilidad al pasar de una a otra. */
        function setEyes(mode, shut) {
          var key = mode + (shut ? "-" : ""); if (key === eyeMode) return; eyeMode = key;
          var blink = shut && mode === "normal";   // solo parpadean los ojos normales (los de susto y los felices ya son trazos)
          eyes.forEach(function (e) { e.visible = mode === "normal" && !blink; }); closed.forEach(function (g) { g.visible = blink; });
          scared.forEach(function (g) { g.visible = mode === "scared"; }); happy.forEach(function (d) { d.visible = mode === "happy"; });
        }
        /* ---------- lenguaje corporal ----------
           Los modelos no tienen esqueleto: el cuerpo se mueve con los grupos de arriba (cuello, tronco, hombros, muñecas, dedos, piernas, cejas).
           En cada fotograma la pose se arma sumando capas, todas con entrada y salida suaves (nunca saltos):
             1) agarre del objeto (ver update): manda sobre el brazo que sostiene; ningún gesto lo mueve, solo el pulgar puede tocar la pantalla;
             2) espera: respiración (tronco y hombros), cambio de peso (el tronco se ladea sobre la cadera; los pies no se mueven), micro-movimientos
                de la cabeza y de la mano libre, y parpadeo cada 2–6 s;
             3) estado de ánimo (api.pose): "talk" | "think" | "worry" | "focus" | "relief" | "listen", mezclados por peso;
             4) gestos de una sola vez (api.gesture(nombre)), con su duración y su curva; y api.say(texto), que reparte gestos distintos según las
                frases y los signos del texto (una pregunta abre la mano y ladea la cabeza; una coma, un gesto corto...), sin repetir el anterior;
             5) mirada (api.lookAt = punto del mundo o null): la cabeza gira hacia el objeto, la luz o lo que se pida, dentro de límites naturales.
           Los gestos usan el reloj real (no el de la escena, que se detiene mientras el usuario decide). Con «reducir movimiento» no hay capas
           animadas: solo las posturas, sin transición, y el parpadeo. Brazos sin codo: los gestos giran desde el hombro y la muñeca. */
        var B = { last: null, w: { talk: 0, think: 0, worry: 0, focus: 0, relief: 0, listen: 0 }, look: { y: 0, p: 0 }, talkK: 0, g: [], q: [], lastQ: "", turn: 0, blinkAt: -9, nextBlink: performance.now() / 1000 + 1.5 + Math.random() * 2, seed: zone === "rural" ? 1.9 : .6 };
        /* posturas: inclinación de cabeza (hp abajo, hr de lado), tronco (tp adelante), hombros (sh), brazo libre [afuera, arriba, adelante, peso] y dedos (curl) */
        var POSES = {
          talk: { tp: .03, hp: -.03, arm: [.28, -.93, .32, .45], curl: .3 },
          think: { hr: .13, hp: .05, sh: .012, arm: [.3, -.4, .85, .7], curl: .75, sway: 1.6 },
          worry: { hp: .12, tp: .05, sh: .022, arm: [.12, -1, .3, .55], curl: .7, brow: 1 },
          focus: { tp: .045, hp: .05 },
          relief: { tp: -.02, hp: -.05, sh: -.008, sway: .6 },
          listen: { hr: -.12, hp: .06, tp: .02 }
        };
        var bsm = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        var benv = function (p, a, b) { return p < a ? bsm(p / a) : p > 1 - b ? bsm((1 - p) / b) : 1; };
        /* brazo libre: cada capa propone una dirección (en «hacia afuera / arriba / adelante») con un peso; se promedian */
        function barm(A, d, w, curl, palm) {
          if (w <= 0) return; A.aw += w; A.ax += d[0] * w; A.ay += d[1] * w; A.az += d[2] * w; A.ac += curl * w;
          if (palm) { A.pw += w; A.px += palm[0] * w; A.py += palm[1] * w; A.pz += palm[2] * w; }
        }
        function bjump(p, A) {   // impulso (rodillas), subida, caída y aterrizaje suave; los brazos acompañan
          var air = p > .22 && p < .62 ? Math.sin(Math.PI * (p - .22) / .4) : 0;
          A.jumpY += .3 * air;
          A.flex = Math.max(A.flex, p < .22 ? bsm(p / .22) : p < .34 ? 1 - bsm((p - .22) / .12) : p < .62 ? 0 : p < .74 ? .7 * bsm((p - .62) / .12) : .7 * (1 - bsm((p - .74) / .26)));
          A.tp += .06 * (p < .3 ? bsm(p / .22) * (1 - bsm((p - .22) / .08)) : 0); A.hp -= .06 * air;
          barm(A, [.6, .45, .4], .9 * air, .1, [0, 0, 1]);
        }
        var GEST = {
          nod: { d: .75, f: function (p, A) { A.hp += .12 * Math.pow(Math.sin(2 * Math.PI * p), 2); } },
          shake: { d: .95, f: function (p, A) { A.hy += .16 * Math.sin(4 * Math.PI * p) * Math.sin(Math.PI * p); A.hp += .03 * Math.sin(Math.PI * p); } },
          tilt: { d: 1.5, f: function (p, A) { var e = benv(p, .25, .35); A.hr += .13 * e; A.hp += .03 * e; } },
          lookUp: { d: 1.6, f: function (p, A) { var e = benv(p, .25, .3); A.hp -= .3 * e; A.lookOff = Math.max(A.lookOff, e); } },
          glance: { d: 2.4, f: function (p, A) { var e = benv(p, .1, .15); A.hy += .38 * Math.sin(2 * Math.PI * p) * e; A.lookOff = Math.max(A.lookOff, e); } },
          beat: { d: .7, f: function (p, A) { var e = Math.sin(Math.PI * p); barm(A, [.38, -.72, .55], .75 * e, .2); A.flick += .25 * e; A.hp += .035 * e; } },
          palm: { d: 1.6, f: function (p, A) { var e = benv(p, .22, .3); barm(A, [.5, -.5, .72], .9 * e, .1, [0, 1, .4]); A.hr += .05 * e; A.tp += .02 * e; } },
          ask: { d: 1.8, f: function (p, A) { var e = benv(p, .2, .3); barm(A, [.62, -.45, .55], .9 * e, .08, [0, 1, .3]); A.sh += .03 * e; A.hr += .12 * e; } },
          raise: { d: 1.7, f: function (p, A) { var e = benv(p, .22, .3); barm(A, [.62, .3, .62], .95 * e, .06, [0, 0, 1]); A.hp -= .05 * e; } },
          point: { d: 1.6, f: function (p, A) { var e = benv(p, .25, .3); if (A.pt) barm(A, A.pt, .85 * e, .3); A.pointW = Math.max(A.pointW, e); } },
          think: { d: 2.2, f: function (p, A) { var e = benv(p, .25, .3); barm(A, [.3, -.38, .85], .8 * e, .75); A.hr += .12 * e; A.hp += .05 * e; } },
          shrug: { d: 1.2, f: function (p, A) { var e = Math.sin(Math.PI * p); A.sh += .035 * e; barm(A, [.48, -.75, .45], .7 * e, .12, [0, 1, .3]); A.hr += .08 * e; } },
          startle: { d: .9, f: function (p, A) { var e = p < .15 ? bsm(p / .15) : bsm((1 - p) / .85); A.sh += .045 * e; A.tp -= .07 * e; A.hp -= .08 * e; barm(A, [.5, -.35, .55], .55 * e, .15); } },
          tap: { d: .55, f: function (p, A) { A.thumb += Math.max(0, Math.sin(4 * Math.PI * p)); } },
          jump: { d: 1.3, f: bjump }
        };
        function bgesture(n) { if (!GEST[n]) return; var now = performance.now() / 1000; B.g = B.g.filter(function (g) { return g.n !== n; }); B.g.push({ n: n, at: now }); }
        /* gestos al hablar: uno por frase, elegido por la puntuación y rotando para no repetir el mismo (al terminar, vuelve solo a la postura) */
        var POOL = ["beat", "palm", "tilt", "nod"];
        function bsay(text) {
          var now = performance.now() / 1000, parts = String(text || "").match(/[^,.;:?!…]+[,.;:?!…]*/g) || [], at = now + .2, out = [];
          parts.forEach(function (ph) {
            var n = /\?/.test(ph) ? "ask" : /…\s*$/.test(ph) ? "think" : POOL[(B.turn++) % POOL.length];
            if (n === B.lastQ) n = n === "nod" ? "beat" : "nod";
            B.lastQ = n; out.push({ at: at, n: n }); at += Math.max(1.1, ph.trim().length / 15);
          });
          B.q = out;
        }
        var L1 = new THREE.Vector3(), L2 = new THREE.Vector3(), L3 = new THREE.Vector3();
        function bclamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
        function bodyPose(now, rdt, reduce) {
          var A = { hp: 0, hy: 0, hr: 0, tp: 0, tr: 0, tyaw: 0, tx: 0, ty: 0, sh: 0, flex: 0, jumpY: 0, aw: 0, ax: 0, ay: 0, az: 0, ac: 0, pw: 0, px: 0, py: 0, pz: 0, pointW: 0, thumb: 0, flick: 0, brow: 0, lookOff: 0, pt: null, sway: 1 };
          var k = reduce ? 1 : Math.min(1, rdt * 2.6);
          Object.keys(POSES).forEach(function (n) {
            B.w[n] += ((api.pose === n ? 1 : 0) - B.w[n]) * k; var w = B.w[n], P = POSES[n]; if (w < .002) return;
            A.hp += (P.hp || 0) * w; A.hr += (P.hr || 0) * w; A.tp += (P.tp || 0) * w; A.sh += (P.sh || 0) * w; A.brow += (P.brow || 0) * w; A.sway += ((P.sway || 1) - 1) * w;
            if (P.arm) barm(A, P.arm, P.arm[3] * w, P.curl);
          });
          if (!reduce) {
            var T = now, s = B.seed;
            B.talkK += ((api.talking ? 1 : 0) - B.talkK) * Math.min(1, rdt * 4);   // mientras habla: pequeños movimientos de cabeza
            A.hp += B.talkK * (.018 * Math.sin(T * 4.4 + s) + .01 * Math.sin(T * 7.1)); A.hr += B.talkK * .012 * Math.sin(T * 2.6 + s);
            var br = Math.sin(T * 2 * Math.PI / 4.2 + s); A.ty += .007 * br; A.tp += .006 * br; A.sh += .005 * br;   // respiración
            var ws = Math.sin(T * 2 * Math.PI / 7.5 + s * 2) * A.sway; A.tr += .016 * ws; A.tx += .02 * ws; A.hr -= .01 * ws;   // peso de un pie al otro
            A.hy += .035 * Math.sin(T * .37 + s) + .015 * Math.sin(T * .91 + s * 3); A.hp += .014 * Math.sin(T * .53 + s);   // cabeza
            A.flick += .05 * Math.sin(T * .8 + s);   // mano libre
            while (B.q.length && now >= B.q[0].at) bgesture(B.q.shift().n);
            var ga = api.gArm || right;
            if (api.lookAt && ga) {   // dirección para señalar el objeto con la mano libre (desde su hombro; x en «hacia afuera» de ese brazo)
              ga.pivot.getWorldPosition(L3); holder.worldToLocal(L3); holder.worldToLocal(L1.copy(api.lookAt)).sub(L3).normalize(); A.pt = [L1.x * ga.sign, L1.y, L1.z];
            }
            B.g = B.g.filter(function (g) { var p = (now - g.at) / GEST[g.n].d; if (p >= 1) return false; if (p >= 0) GEST[g.n].f(p, A); return true; });
          } else { B.g = []; B.q = []; }
          /* api.reach = { target: punto del mundo, w: 0–1, curl }: la mano libre va hacia ese punto (p. ej. la punta de la antena) y lo toma. Manda sobre
             las demás capas del brazo (peso alto); también con «reducir movimiento», porque es una acción de la escena, no un gesto */
          var gr = api.gArm || right, R = api.reach;
          if (R && R.w > 0.001 && R.target && gr) {
            gr.pivot.getWorldPosition(L3); holder.worldToLocal(L3); holder.worldToLocal(L1.copy(R.target)).sub(L3).normalize();
            barm(A, [L1.x * gr.sign, L1.y, L1.z], 6 * R.w, R.curl == null ? 1 : R.curl, R.palm || null);
          }
          /* mirada: la cabeza gira hacia api.lookAt (en el espacio del personaje), dentro de límites naturales */
          var ly = 0, lp = 0;
          if (api.lookAt && neck) {
            holder.worldToLocal(L1.copy(api.lookAt)); L2.setFromMatrixPosition(neck.matrixWorld); holder.worldToLocal(L2); L2.y += .5;
            var dx = L1.x - L2.x, dy = L1.y - L2.y, dz = L1.z - L2.z;
            ly = bclamp(Math.atan2(dx, Math.max(.05, dz)), -.5, .5) * .8; lp = bclamp(Math.atan2(-dy, Math.hypot(dx, dz)), -.3, .5) * .55;   // cabeza grande: gira menos de lo que «miraría» (los ojos no se mueven)
          }
          var kk = reduce ? 1 : Math.min(1, rdt * 3.5), lo = 1 - A.lookOff;
          B.look.y += (ly - B.look.y) * kk; B.look.p += (lp - B.look.p) * kk; A.hy += B.look.y * lo; A.hp += B.look.p * lo;
          return A;
        }
        parent.add(holder); var q = new THREE.Quaternion(), direction = new THREE.Vector3(), waveDir = new THREE.Vector3(), twist = new THREE.Quaternion(), palm = new THREE.Vector3(), want = new THREE.Vector3(), want2 = new THREE.Vector3(), fw = 0, last = null;
        var hfA = new THREE.Vector3(), hfB = new THREE.Vector3(), hfC = new THREE.Vector3(), hfBox = new THREE.Box3(), hEuler = new THREE.Euler(0, 0, 0, "YXZ");   // cabeza: primero gira (como «no»), después se inclina (como «sí»); así no se ladea sola
        var api = { root: holder, materials: Array.from(materials.values()), skin: skin, shirt: shirt, ready: true,
          update: function (time, topic, kind, reduce, speaking, opacity, farewell) {
            var t = reduce ? 0 : time, dt = last === null ? 0 : Math.max(0, Math.min(.1, time - last)); last = time;
            fw = reduce ? (farewell ? 1 : 0) : fw + ((farewell ? 1 : 0) - fw) * Math.min(1, dt * 2.6);
            /* sismo (kind "quake"): no sostiene nada, las manos quedan abiertas y relajadas; api.fear (0–1) añade la postura de miedo y los ojos «> <» */
            var quake = kind === "quake", free = kind === "none" || quake, fk = quake ? Math.max(0, Math.min(1, api.fear || 0)) : 0, fe = fk * fk * (3 - 2 * fk);
            /* lenguaje corporal (ver bodyPose): con el reloj real */
            var now = performance.now() / 1000, rdt = B.last === null ? 0 : Math.max(0, Math.min(.05, now - B.last)); B.last = now;
            var A = bodyPose(now, rdt, reduce), calm = 1 - fe;   // con miedo, la postura del sismo manda
            /* caminar: piernas opuestas desde la cadera; swing (−1…1) mueve el brazo libre al revés que su pierna */
            var wlk = api.walk && api.walk.k > 0 ? api.walk : null, swing = 0;
            if (wlk && !legRig) legRig = buildLegs();
            var lift = 0;
            if (legRig) {
              var amp = wlk ? .34 * wlk.k : 0, ph = wlk ? wlk.phase : 0;
              legRig.forEach(function (l) { var ang = -l.s * amp * Math.sin(ph); l.g.rotation.x = ang; lift = Math.max(lift, l.L * (1 - Math.cos(ang))); });
              swing = wlk ? Math.sin(ph) * wlk.k : 0;
            }
            holder.position.y = -lift + A.jumpY;   // salto: todo el cuerpo sube (los pies se despegan juntos y vuelven al suelo)
            /* tronco: miedo (baja ~16 % de la pierna, se inclina hacia delante ~12° y un poco a un lado) + rodillas del salto + respiración, peso y postura.
               El pantalón se acorta desde el suelo como si flexionara las rodillas (las piernas son piezas enteras); los zapatos no cambian. */
            if (crouch) {
              var bend = Math.max(fe, A.flex), drop = .16 * crouch.legH * bend, wsx = wlk ? 0 : 1;
              crouch.torso.position.set(A.tx * wsx * calm, crouch.y0 - drop + A.ty, 0);
              crouch.torso.rotation.set(.21 * fe + A.tp * calm, .05 * swing + A.tyaw, .06 * fe + .02 * swing + A.tr * wsx * calm);
              crouch.hips.scale.set(1 + .05 * bend, 1 - drop / crouch.legH, 1);
            }
            /* hombros: suben y bajan juntos (respiración, duda, susto); las piezas se quedan unidas porque se mueven muy poco */
            [left, right].forEach(function (a) { if (!a) return; if (a.py0 === undefined) a.py0 = a.pivot.position.y; a.pivot.position.y = a.py0 + bclamp(A.sh, -.015, .05); });
            /* cejas (Mateo): el extremo de adentro sube con la preocupación */
            brows.forEach(function (b) { b.g.rotation.z = -b.dir * .28 * bclamp(A.brow, 0, 1); });
            /* ojos: de susto en el sismo; felices en la despedida de cada recorrido (kind = objeto de la alternativa). La portada usa kind "none" y tiene sus propios ojos felices. */
            /* api.mood ("scared" | "happy" | null): lo pide la historia de una alternativa (preocupación al inicio, alivio al final) */
            /* parpadeo cada 2–6 s (~0,13 s); la portada tiene el suyo (api.autoBlink = false) */
            if (api.autoBlink !== false && now >= B.nextBlink) { B.blinkAt = now; B.nextBlink = now + 2.2 + Math.random() * 3.6; }
            setEyes(fk > .35 || api.mood === "scared" ? "scared" : (farewell && !free) || api.mood === "happy" ? "happy" : "normal", api.autoBlink !== false && now - B.blinkAt < .13);
            [left, right].forEach(function (a) { if (!a) return;
              var roll = 0, curl = quake ? .14 : .35, wk = 0, palmTo = null, out = a.sign;   // out: +1 brazo izquierdo, -1 derecho (lado hacia fuera del cuerpo)
              /* qué brazo saluda: el derecho; sin objeto (portada) puede ser el izquierdo si api.waveSide = "left" */
              var waver = kind === "none" && api.waveSide === "left" ? left : right;
              /* brazo de los gestos: el derecho; sin objeto (portada) puede ser el izquierdo si api.gestureSide = "left" (el que queda hacia el centro) */
              var garm = free && api.gestureSide === "left" && left ? left : right; api.gArm = garm;
              if (a === left && !free) {
                var ek = api.earK == null ? null : Math.max(0, Math.min(1, api.earK)), tp = ek == null ? topic : "phone";   // api.earK: historias de llamada (0 en la mano → 1 en la oreja)
                var hk = tp === "llamadas" || tp === "cobertura" ? tp : kind === "radio" ? "radio" : kind === "torch" ? "torch" : "phone", h = (HOLD_ZONE[zone] && HOLD_ZONE[zone][hk]) || HOLD[hk];
                direction.set(h.d[0], h.d[1], h.d[2]); roll = h.roll || 0; curl = h.curl; if (h.palm) palmTo = want2.set(h.palm[0], h.palm[1], h.palm[2]);
                if (hk === "phone" && ek) { var he = HOLD.llamadas; direction.normalize().lerp(dTmp.set(he.d[0], he.d[1], he.d[2]).normalize(), ek); }   // de la mano a la oreja, de a poco (mismo giro y mismos dedos)
                if (hk === "phone" && api.raiseK > 0) { var hr = HOLD.cobertura; direction.normalize().lerp(dTmp.set(hr.d[0], hr.d[1], hr.d[2]).normalize(), Math.min(1, api.raiseK)); }
                /* api.holdLift (0–1): levanta el objeto que sostiene hasta delante del pecho (la radio, para mover su antena con la otra mano) */
                if (api.holdLift > 0) { var lk = Math.min(1, api.holdLift); direction.normalize().lerp(dTmp.set(HOLD_LIFT.d[0], HOLD_LIFT.d[1], HOLD_LIFT.d[2]).normalize(), lk); if (palmTo) palmTo.lerp(want.set(HOLD_LIFT.palm[0], HOLD_LIFT.palm[1], HOLD_LIFT.palm[2]), lk); }
              } else {
                direction.set(out * .22, -1, .1 + (a === left ? api.bagFwd : 0) + (a === right ? .45 : -.45) * swing);   // brazo relajado (el izquierdo, delante del bolso si lo hay)
                if (a === garm && A.aw > .001 && !wlk) {   // posturas y gestos de la mano libre (ver bodyPose); al caminar, el brazo se balancea
                  var aw = Math.min(1, A.aw) * calm;
                  direction.normalize().lerp(dTmp.set(out * A.ax / A.aw, A.ay / A.aw, A.az / A.aw).normalize(), aw); curl += (A.ac / A.aw - curl) * aw;
                  if (A.pw > .001) { palmTo = want2.set(A.px / A.pw, A.py / A.pw, A.pz / A.pw); wk = Math.min(1, A.pw) * calm; }
                }
                if (a === waver && fw > .001) {   // saludo: el brazo sube y la mano abierta se mece suavemente de lado a lado, con la palma hacia quien mira
                  palmTo = null;
                  var k = Math.max(0, Math.min(1, (fw - .3) / .7)); k = k * k * (3 - 2 * k);
                  direction.lerp(waveDir.set(out * (.7 + Math.sin(t * 3.6) * .13), .82 + Math.cos(t * 3.6) * .04, .36), k); curl = .35 * (1 - k) + .08 * k; wk = k;
                }
                if (fe > .001) {   // miedo: los brazos suben hacia la cabeza, por delante de la cara y por debajo de los ojos, con las palmas abiertas hacia fuera y un leve temblor
                  if (fe > .5) palmTo = null;
                  direction.normalize().lerp(waveDir.set(out * (.3 + Math.sin(t * 23 + out) * .025), .8 + Math.sin(t * 19) * .02, .55), fe); curl = curl * (1 - fe) + .1 * fe; wk = fe;
                }
              }
              direction.normalize(); a.pivot.quaternion.setFromUnitVectors(a.axis, direction);
              if (roll) a.pivot.quaternion.premultiply(twist.setFromAxisAngle(direction, roll * a.sign));
              if (wk || palmTo) {   // gira el brazo sobre su eje para que la palma (+z en reposo) mire hacia donde se pide (al saludar, a la cámara), sin cambiar hacia dónde apunta
                if (!palmTo) palmTo = want2.set(0, 0, 1);
                palm.set(0, 0, 1).applyQuaternion(a.pivot.quaternion); want.copy(palmTo).addScaledVector(direction, -palmTo.dot(direction)).normalize();
                var ang = Math.atan2(palm.clone().cross(want).dot(direction), palm.dot(want));
                a.pivot.quaternion.premultiply(twist.setFromAxisAngle(direction, ang * (wk || 1)));
              }
              /* giro extra de la mano sobre el eje del brazo cuando no sostiene nada (api.handTwist, por personaje): suelta → relax, saludando → wave */
              if (api.handTwist && !(a === left && !free)) {
                var tw = api.handTwist.relax * (1 - wk) + api.handTwist.wave * wk;
                if (tw) a.pivot.quaternion.premultiply(twist.setFromAxisAngle(direction, tw * a.sign));
              }
              /* dedos (base: dedos juntos, Mateo). Señalar: el índice estirado y los demás recogidos. Tocar la pantalla: el pulgar de la mano que
                 sostiene el celular baja un poco y vuelve (los demás dedos no se mueven, así el celular no se suelta) */
              var pw2 = a === garm && !wlk ? A.pointW * calm : 0, tap = a === left && !free && kind === "phone" ? bclamp(A.thumb, 0, 1) : 0;
              /* pinza (api.reach, p. ej. tomar la punta de la antena): índice y pulgar doblados por sus articulaciones hasta tocarse; los otros tres, cerrados */
              var pk = a === garm && api.reach && api.reach.w > 0.001 ? Math.min(1, api.reach.w) : 0;
              a.fingers.forEach(function (f) {
                var c = curl; if (pw2) c += ((f.index ? .05 : f.thumb ? .9 : 1.45) - c) * pw2;
                var kn = c * (f.thumb ? .6 : 1) + (f.thumb ? .35 * tap : 0), j1 = 0, j2 = 0;
                if (pk) { var P = f.thumb ? PINCH.thumb : f.index ? PINCH.index : PINCH.rest; kn += (P[0] - kn) * pk; j1 = P[1] * pk; j2 = P[2] * pk; }
                f.g.quaternion.setFromAxisAngle(Y, -a.sign * kn).multiply(f.base);
                if (f.joints) f.joints.forEach(function (J) { J.b1.quaternion.setFromAxisAngle(J.ax, -a.sign * j1); J.b2.quaternion.setFromAxisAngle(J.ax, -a.sign * j2); });
              });
              /* muñeca de la mano libre: un giro pequeño con los gestos. La que sostiene no gira: el agarre no se rompe */
              if (a.wrist) a.wrist.quaternion.setFromAxisAngle(Y, a === garm && !wlk ? -a.sign * bclamp(A.flick, -.3, .3) * calm : 0);
            });
            /* cabeza, desde el cuello: miedo (baja) + postura, mirada, gestos y espera, dentro de límites naturales */
            if (neck) { q.setFromEuler(hEuler.set(.26 * fe + bclamp(A.hp * calm, -.3, .36), bclamp(A.hy * calm, -.55, .55), bclamp(A.hr * calm, -.22, .22), "YXZ")); neck.quaternion.copy(q); }
            api.materials.forEach(function (m) { var fading = opacity < .999; if (m.transparent !== (m.userData.baseTransparent || fading)) { m.transparent = m.userData.baseTransparent || fading; m.needsUpdate = true; } m.opacity = m.userData.baseOpacity * opacity; });
            holder.updateMatrixWorld(true);
          },
          wrist: function (out) { if (left) left.grip.getWorldPosition(out); else holder.getWorldPosition(out); return out; },
          /* hueco de la mano que sostiene (izquierda): el punto entre los nudillos y los dedos cerrados donde queda un asa, y la línea de los nudillos.
             Sirve para colgar un objeto de la mano (la radio por su asa) en vez de ponerlo con una distancia fija a la muñeca. */
          /* pocket (opcional): centro para un mango grueso (la linterna). Los dedos son piezas rígidas que se doblan solo en el nudillo, así que un
             mango grueso no cabe en el punto de pos (quedaría atravesado por los dedos): va en el gancho entre los dedos doblados y la muñeca, apoyado
             en la cara interna de los dedos. Medido en Valeria con el mango de la linterna: 0,70 del largo nudillo–dedos hacia la muñeca y 0,19 hacia
             los dedos (proporcional al tamaño de la mano, para que sirva también a Mateo). */
          holdFrame: function (pos, axis, pocket) {
            if (!left) return false;
            var fs = left.fingers.filter(function (f) { return !f.thumb; }); if (fs.length < 2) return false;
            var kn = hfA.set(0, 0, 0), ce = hfB.set(0, 0, 0), bases = [];
            fs.forEach(function (f) { var p = f.g.getWorldPosition(new THREE.Vector3()); bases.push(p); kn.add(p); ce.add(hfBox.setFromObject(f.g).getCenter(hfC)); });
            kn.multiplyScalar(1 / fs.length); ce.multiplyScalar(1 / fs.length);
            pos.copy(kn).lerp(ce, 0.8);
            var a = bases[0], b = bases[1], d = 0;
            bases.forEach(function (p) { bases.forEach(function (q) { var dd = p.distanceToSquared(q); if (dd > d) { d = dd; a = p; b = q; } }); });
            axis.copy(b).sub(a).normalize();
            if (pocket) {
              var fd = new THREE.Vector3().copy(ce).sub(kn), L = fd.length();
              fd.addScaledVector(axis, -fd.dot(axis)).normalize();   // de los nudillos hacia los dedos doblados
              var wd = left.pivot.getWorldPosition(new THREE.Vector3()).sub(kn); wd.addScaledVector(axis, -wd.dot(axis)).normalize();   // de los nudillos hacia la muñeca (el brazo es rígido: hacia el hombro)
              pocket.copy(pos).addScaledVector(fd, 0.19 * L).addScaledVector(wd, 0.70 * L);
            }
            return true;
          },
          dispose: function () { holder.removeFromParent(); dispose(holder); }
        };
        /* Mateo lleva un bolso colgado a su izquierda: con el brazo izquierdo suelto (portada, sismo) la mano quedaba dentro del bolso.
           Ese brazo se adelanta lo justo para pasar por delante (medido en la escena). Sin bolso en ese lado, no cambia nada. */
        api.bagFwd = 0; holder.traverse(function (o) { if (o.isMesh && /bolso/i.test(o.name) && !/borde/i.test(o.name)) api.bagFwd = .5; });   // holder: las piezas del tronco ya cuelgan de su pivote
        holder.userData.api = api;
        /* lenguaje corporal desde fuera: api.pose, api.lookAt, api.talking (cada fotograma) y estos tres para momentos de la historia */
        api.gesture = bgesture; api.say = bsay; api.quiet = function () { B.g = []; B.q = []; };
        /* mano suelta de Mateo: con el brazo adelantado (delante del bolso) la palma quedaba girada; se gira sobre el eje del brazo para que cuelgue
           como la de Valeria (medido: −0,35 rad). La mano que saluda ya mira igual que la de ella, en espejo */
        api.handTwist = zone === "rural" ? { relax: -.35, wave: 0 } : null;
        api.update(0, "sms", "phone", true, false, 0, false); resolve(api);
      }, undefined, reject);
    });
  }
  return { load: load, HOLD: HOLD, HOLD_ZONE: HOLD_ZONE };
})();
