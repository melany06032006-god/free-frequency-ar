/* Free Frequency — contenido. Todo texto se edita aquí.
   Dos zonas (Ruralidad — Cauca, Urbanidad — Cali) y exactamente tres objetos: teléfono celular, radio portátil AM/FM y linterna.
   Cada zona tiene su propia explicación de cada objeto (`zones[zona].items[objeto]`), con uno o varios temas (`objects`): cada tema es una acción
   con su demostración en el primer plano y su cuadro. Tema: what (cómo ayuda), net (qué conexión necesita: [depende?, texto]; se omite si no aplica),
   limit (condiciones y límites), hint (indicación breve de interacción).
   Todos los objetos usan la misma secuencia visual (js/sequence.js): 1) objeto protagonista → 2) primer plano de las manos → 3) personaje completo → 4) cuadro.

   FUENTES (revisadas en octubre de 2026; se consultaron resúmenes de prensa que citan a las entidades, no siempre los documentos originales: conviene
   volver a los sitios oficiales antes de publicar):
   · Línea única de emergencias 123; llamadas gratuitas a líneas de emergencia aun sin saldo; recomendación de usar mensajes de texto o mensajería
     cuando la voz está congestionada: MinTIC (mintic.gov.co) y CRC, Comisión de Regulación de Comunicaciones.
   · Durante un sismo, protegerse (proteger la cabeza, alejarse de vidrios y objetos que puedan caer; en la calle, lejos de postes y cables); kit de emergencia
     con linterna, silbato y pilas; radio a pilas para seguir las actualizaciones: UNGRD, Unidad Nacional para la Gestión del Riesgo de Desastres (gestiondelriesgo.gov.co).
   · Información oficial sobre sismos y reporte «Sismo sentido»: Servicio Geológico Colombiano (sgc.gov.co).
   · Restablecimiento de contacto entre familiares: Cruz Roja Colombiana (cruzrojacolombiana.org).
   · Marcar 119 (Cali, antes «Mensajes de voz»): el equipo confirmó que en Colombia se marca solo 119, sin asterisco;
     la línea 119 de mensajes de voz es del MTC de Perú y en Colombia el 119 es Bomberos. Confirmar antes de publicar.
     La CRC (agosto de 2026) recuerda que, con la voz congestionada, los operadores deben dar prelación a los SMS y la mensajería.
   NO se citan alcances de radios, frecuencias, tipos de red ni garantías de conectividad. Los textos son generales y prudentes. */
window.FF = {
  order: ["telefono", "radio", "linterna"],
  seq: { steps: ["Objeto", "Práctica", "Personaje", "Información"], storySteps: ["Objeto", "Práctica", "Historia", "Lo aprendido"], skip: "Saltar introducción" },   // storySteps: alternativas con historia (por ahora, SMS en Cali)
  /* zona rural: escena breve al entrar (en lugar del sismo de Cali): Mateo se da cuenta de que no tiene señal */
  nosignal: {
    during: "Sin señal",
    duringText: "Mateo quiere avisarle a su familia que está bien, pero su celular no tiene señal. En algunas veredas la cobertura es débil o no existe.",
    after: "¿Y ahora qué?",
    afterText: "Sin señal no puede llamar ni enviar mensajes. Veamos qué alternativas tiene para comunicarse.",
    cont: "Ver las alternativas",
    skip: "Saltar",
    still: "Movimiento reducido: la escena no se mueve.",
    bubble: "¡No tengo señal!"
  },
  info: {
    overview: "Tres alternativas, tres formas de comunicar. El teléfono celular envía SMS y llamadas breves, pero necesita una red celular disponible. La radio AM/FM solo recibe información (no transmite) y funciona sin internet ni red celular: necesita pilas y una emisora. La linterna envía señales visuales, como el SOS en código Morse, a quien pueda verlas. Ninguna garantiza la comunicación: se complementan.",
    /* «Elige una zona»: frase corta bajo el título y bloque compacto «¿Por qué elegimos estas zonas?» (la explicación completa se despliega a pedido) */
    pickLead: "Elige y descubre qué hacer si ocurre una emergencia y cómo comunicarte cuando falla la señal.",
    pickGo: "Explorar zona",
    whyTitle: "¿Por qué elegimos estas zonas?",
    whyLead: "Dos realidades diferentes que ayudan a comprender los retos de la comunicación.",
    whyIdeas: ["Señal limitada", "Redes congestionadas", "Alternativas de comunicación"],
    whyMore: "Ver la explicación completa",
    whyLess: "Ocultar la explicación",
    whyNote: "Es una comparación entre dos contextos, no una afirmación de que todas las zonas rurales del Cauca carezcan de conectividad ni de que toda Cali tenga buena cobertura. Son ejemplos para aprender, no una predicción: ningún dato de esta experiencia indica que vaya a ocurrir un sismo.",
    whySources: "Ver fuentes y créditos"
  },

  /* Zonas narrativas */
  zones: {
    rural: {
      id: "rural", name: "Ruralidad — Cauca", short: "Cauca", label: "Ruralidad · Cauca", who: "Mateo", role: "Joven caucano", scene: "cauca", quake: false, nosignal: true,   /* zona rural: sin sismo; al entrar, Mateo descubre que no tiene señal (FF.nosignal) */
      img: "assets/scenes/cauca-back.svg", char: "assets/characters/cauca.png",
      cardImg: "assets/scenes/cauca-paisaje.webp", cardSky: "assets/scenes/cauca-cielo.svg",   // tarjeta en «Elige una zona»: la ilustración de la vereda (sin su cielo gris, ver js/card-art.js) sobre el cielo azul con nubes
      tag: "Vereda de montaña · Señal débil o inexistente",
      blurb: "Montañas, caminos de tierra y una vereda donde la señal del celular aparece y desaparece. ¿Cómo comunicarse cuando no hay conexión?",
      why: "Se eligió el Cauca como zona rural porque combina montañas y veredas donde la cobertura celular puede ser débil o intermitente y donde llegar a algunos lugares puede ser difícil. Además tiene una historia sísmica conocida: el sismo de Popayán de 1983, de magnitud 5,5, afectó gravemente la región. Sirve para pensar cómo comunicarse cuando la señal falla.",
      whyTag: "Contexto rural",
      pick: "Explora cómo comunicarte cuando la cobertura es débil o intermitente.",
      whyText: "En algunas veredas rurales y zonas de montaña, la cobertura celular puede ser débil o intermitente. Por eso es importante conocer alternativas de comunicación que no dependan exclusivamente de una conexión estable.",
      whyKey: "La radio y las señales visuales pueden ayudar cuando las condiciones lo permiten: que haya emisora, pilas y alguien que vea la luz.",
      whyLead: "Un territorio de montañas y veredas donde, en algunos lugares, la señal puede ser débil o intermitente.",
      whyPoints: ["Importa considerar lugares donde la cobertura celular o el acceso a internet pueden ser limitados.","Hace falta conocer opciones que no dependan solo de aplicaciones digitales.","La radio y las señales visuales pueden ayudar cuando las condiciones lo permiten: que haya emisora, pilas y alguien que vea la luz."],
      items: {
        telefono: {
          kicker: "Teléfono celular · Ruralidad — Cauca",
          bye: "Gracias por recorrer el teléfono en el Cauca. Ninguna de estas opciones garantiza la comunicación: dependen de que haya una red celular disponible.",
          objects: [
            {
              id: "sms", name: "Mensajes SMS", label: "SMS", sms: true,
              icon: "sms", tutorial: {"title":"Tutorial: cómo redactar y enviar un SMS (simulado)","steps":["Toca el icono «Mensajes» en la pantalla de inicio del teléfono de práctica.","Se abre la interfaz de SMS: verás un campo para el número y otro para el mensaje.","Escribe un número de celular ficticio con el teclado numérico (o usa el número de ejemplo). No es un número real.","Toca el campo del mensaje y escríbelo con el teclado virtual. Ejemplo: «Hola, ¿cómo estás?». Puedes borrar con ⌫, corregir el texto y volver a escribir.","Pulsa el botón de enviar (➤).","La pantalla muestra «Envío simulado». No se asegura que el mensaje haya sido recibido, porque no existe una conexión real. Puedes repetir el ejercicio."]},
              /* en el Cauca no hay emergencia: el problema es la cobertura. La práctica y la historia usan un mensaje del día a día (un saludo), no «Estoy bien» */
              exampleMsg: "Hola, ¿cómo estás?", exampleHint: "Hola, ¿cómo estás?",
              lead: "Un SMS es un mensaje de texto común y corriente. Lo escribes en la aplicación «Mensajes» de tu celular (el icono suele ser un globo de diálogo) y viaja por la red celular, sin internet.",
              intro: "Un SMS es un mensaje de texto corto, como los de siempre. Para escribirlo, abre en tu celular la aplicación «Mensajes» (también puede llamarse «SMS» o «Mensajería»; su icono suele ser un globo de diálogo). Allí eliges un número, escribes el texto y lo envías. A diferencia de muchas aplicaciones de mensajería, no necesita una conexión a internet, pero sí requiere que el servicio de mensajes y la red celular estén disponibles.",
              why: "En las veredas la señal puede ser débil o ir y venir. Un SMS usa muy poca red: a veces sale cuando una llamada no se puede completar o internet no carga, aunque su entrega no está garantizada.",
              what: ["En el Cauca rural, un SMS puede ser útil cuando no hay internet, pero necesita cobertura de la red celular. Si no existe señal, el mensaje podría quedar pendiente o no enviarse. Si la señal aparece y desaparece, puede salir en el momento en que el teléfono logre conectarse.",
                "La cobertura cambia con el terreno, los árboles y la distancia a las antenas: desplazarte con precaución hacia un lugar abierto y seguro puede ayudar, aunque no garantiza que aparezca señal. No te alejes sin necesidad, no camines por zonas peligrosas y evita subir a lugares elevados solo para buscar señal. Tu seguridad va primero."],
              net: { internet: [0, "No la necesita para SMS"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Sin cobertura el mensaje no sale, y que salga no garantiza que llegue ni que lo lean. Envíalo una sola vez.",
              hint: "Sigue los pasos en el teléfono de práctica: no se envía nada real y el número es ficticio.",
              /* Historia «El mensaje en espera» (story.kind "wait", ver js/sequence.js): une el SMS con «Buscar un lugar con mejor señal».
                 Mateo, entre los árboles y sin señal, arma su mensaje; queda en espera; el usuario elige qué hacer y Mateo camina con calma hasta un
                 claro abierto y seguro, donde el celular encuentra una barra y el mensaje sale solo. En Cali la historia es otra: la red está saturada. */
              story: {
                kind: "wait", box: "Mensaje de Mateo",
                comment: "Quiero escribirle a mi familia para saludarla, pero aquí, entre los árboles, no tengo señal.",
                busy: "Sin señal", busyNote: "Entre los árboles no llega la red", busyBars: 0,
                task: "Ayuda a Mateo a escribir un mensaje corto: toca las ideas que van en el saludo.",
                parts: [["hola", "Saludar", "Hola, ¿cómo estás?"], ["larga", "Contar todo lo de la semana", ""], ["donde", "Dónde está", "Estoy en la finca."], ["cuando", "Cuándo se ven", "Nos vemos el domingo."]],
                wrong: "Mejor no: con poca señal, un mensaje corto tiene más opciones de salir.",
                ready: "¡Listo! Toca ➤ para enviarlo (simulado).",
                pending: "Mensaje en espera", pendingNote: "Sin señal: saldrá cuando haya red", pendingTag: "En espera",
                waitTask: "El mensaje quedó en espera porque no hay señal. ¿Qué hace Mateo ahora?",
                choices: [["reenviar", "Reenviarlo varias veces", "Insistir desde aquí"], ["claro", "Caminar a un claro abierto y seguro", "Sin correr, por el camino"], ["barranco", "Subir a la orilla del barranco", "Es el punto más alto"]],
                wrongs: {
                  reenviar: "No hace falta: el celular guarda el mensaje y lo envía solo cuando encuentra señal. Reenviarlo gasta batería y puede llegar repetido.",
                  barranco: "Más alto no siempre es mejor: la orilla de un barranco no es un lugar seguro, puedes resbalar o caer."
                },
                walkBubble: "Voy a un lugar abierto y seguro, sin correr.",
                searching: "Buscando señal…",
                sent: "Mensaje enviado", sentNote: "Que salga no garantiza que llegue",
                bubble: "¡Salió! El celular lo envió apenas encontró señal.",
                key: "Sin señal, un SMS puede quedar en espera: no lo reenvíes. Busca con calma un lugar abierto y seguro; el celular lo enviará cuando encuentre red.",
                facts: [["no", "Internet", "No la necesita"], ["yes", "Red celular", "Sí: sale cuando hay señal"], ["warn", "Sin garantía", "Que salga no asegura que llegue"]]
              }
            },
            /* «Buscar mejor señal» (cobertura) y «Buscar un lugar con mejor señal» (lugar) se quitaron: la historia del SMS («El mensaje en espera»)
               ya muestra a Mateo caminando con calma hasta un claro abierto y seguro. La caminata (WALK en js/sequence.js) la usa esa historia. */
            {
              id: "reconexion", name: "Modo avión", label: "Modo avión", airplane: true,
              lead: "El modo avión apaga por un momento las conexiones del celular. Activarlo unos segundos y desactivarlo obliga al teléfono a reconectarse a la red, y a veces así salen los mensajes que estaban pendientes.",
              intro: "El modo avión desactiva las conexiones inalámbricas del teléfono. Al desactivarlo, el celular vuelve a buscar red desde cero: se registra otra vez con las antenas y vuelve a armar la conexión de datos. Por sí solo no aumenta la señal, pero ese «reinicio» de la conexión puede ayudar.",
              whatTitle: "¿Cómo ayuda?",
              what: [
                "Si tu celular muestra algo de señal pero los mensajes (SMS o WhatsApp) no salen, activa el modo avión unos segundos y desactívalo. Al reconectarse, el teléfono puede engancharse a una antena mejor o recuperar una conexión de datos que se había quedado trabada, y en ese momento los mensajes pendientes pueden enviarse.",
                "También sirve cuando la señal va y viene: al reconectarse puede aprovechar un momento en que sí hay cobertura. No olvides desactivarlo: con el modo avión activo no entran ni salen llamadas ni mensajes."
              ],
              net: { internet: [0, "Mientras el modo avión está activo, no hay conexión"], cellular: [1, "Sí: solo ayuda si en el lugar hay algo de cobertura"] },
              limit: "Si en el lugar no hay ninguna cobertura, activarlo y desactivarlo no sirve: no hay red a la cual conectarse. Tampoco garantiza que el mensaje salga ni que llegue.",
              hint: "Activa el modo avión unos segundos, desactívalo y mira cómo el teléfono vuelve a buscar red."
            }
          ]
        },
        radio: {
          kicker: "Radio AM/FM · Ruralidad — Cauca",
          bye: "Gracias por recorrer la radio en el Cauca. Recuerda que solo recibe y que depende de que haya una emisora disponible.",
          objects: [
            {
              id: "radio", name: "Radio AM/FM", label: "Radio", tuner: true,
              lead: "Una radio AM/FM solo recibe emisoras. Se enciende con la perilla, se elige AM o FM y se mueve el dial hasta oír una emisora con claridad.",
              intro: "Una radio AM/FM recibe las señales que emiten las emisoras y las convierte en sonido. Solo recibe: no transmite. Con pilas funciona sin internet ni red celular.",
              what: "Si hay una emisora disponible, una radio portátil con pilas permite escuchar información sin internet ni red celular, algo útil cuando la señal del teléfono no llega a la vereda.",
              net: { internet: [0, "No la necesita"], cellular: [0, "No la necesita"] },
              limit: "Necesita pilas y recepción de una emisora; en zonas de montaña la recepción puede variar con el lugar. Solo recibe: no transmite.",
              hint: "Gira las perillas, cambia entre AM y FM y mueve el dial."
            }
          ]
        },
        linterna: {
          kicker: "Linterna · Ruralidad — Cauca",
          bye: "Gracias por recorrer la linterna en el Cauca. Una señal de luz solo sirve si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
          guided: true,
          guide: {
            "s1": {
              "title": "Una luz también puede comunicar",
              "morse": "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              "text": "Cuando no puedes comunicarte por una llamada o un mensaje, los destellos de una linterna pueden ayudarte a transmitir una señal."
            },
            "s2": {
              "title": "Destello corto y destello largo",
              "text": "En el código Morse, las letras se representan combinando señales cortas y largas. Con una linterna, enciendes la luz con su botón: si lo sueltas enseguida (cerca de 0,2 segundos) haces un destello corto, y si lo mantienes presionado (cerca de 0,6 segundos) haces un destello largo. Entre un destello y otro, deja la luz apagada un instante."
            },
            "s3": {
              "title": "La señal SOS",
              "text": "SOS es una señal internacional de socorro. En código Morse se forma así: S = tres destellos cortos, O = tres destellos largos y S = tres destellos cortos.",
              "msg": "Para pedir ayuda, puedes repetir la señal SOS con una linterna e intentar que sea visible para otras personas.",
              "note": "La señal solo será útil si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
              "zone": "Si estás en una zona rural y no tienes señal telefónica, los destellos pueden servir como una señal visual para alguien que esté cerca. Busca un lugar seguro y visible, sin exponerte a terrenos peligrosos."
            },
            "p": {
              "title": "Practica la señal",
              "text": "Pulsa «Destello corto» o «Destello largo», reproduce el SOS, o mantén presionado el interruptor de la linterna: se enciende mientras lo sostienes y se apaga al soltarlo. Es solo una práctica: no se envía nada."
            }
          },
          objects: [
            {
              id: "escena", name: "Linterna y código Morse", label: "Linterna", toggle: true, whatTitle: "¿Cómo ayuda?",
              lead: "La linterna se enciende al presionar su botón de encendido. Si lo presionas poco rato haces un destello corto, y si lo mantienes más, un destello largo.",
              intro: "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              what: "Una linterna permite enviar señales visuales sin depender de una conexión a internet o de una red celular. Mediante el código Morse, puedes transmitir señales como SOS a personas que estén dentro del alcance visual.",
              limit: "Necesitas una linterna con batería, un entorno en el que los destellos puedan verse y una persona capaz de reconocer la señal. La luz puede quedar oculta por obstáculos, la distancia o las condiciones ambientales. El código Morse no sustituye los servicios de emergencia ni garantiza una respuesta.",
              hint: "Enciende y apaga la linterna, o mantén presionado el interruptor para formar puntos y rayas."
            }
          ]
        }
      }
    },

    urbano: {
      id: "urbano", name: "Urbanidad — Cali", short: "Cali", label: "Urbanidad · Cali", who: "Valeria", role: "Joven caleña", scene: "cali",
      img: "assets/scenes/cali-back.svg", char: "assets/characters/cali.png",
      cardImg: "assets/scenes/ciudad-cali-cielo.png",   // fondo de la tarjeta en «Elige una zona»: ciudad y cielo en una sola ilustración (inspirada en el escenario de Blender)
      tag: "Después de un sismo · Redes congestionadas",
      blurb: "Una calle de Cali después de un sismo: la electricidad, internet o la red celular pueden fallar. ¿Cómo comunicarse con seguridad?",
      why: "Se eligió Cali como zona urbana porque es una de las ciudades más grandes del país y, según la Alcaldía de Cali (dato de 2020), la única de Colombia con más de un millón de habitantes ubicada en una zona de amenaza sísmica alta. Tras un sismo las redes pueden saturarse o fallar: por eso sirve para practicar cómo comunicarse con seguridad después del movimiento.",
      whyTag: "Contexto urbano",
      pick: "Descubre qué hacer cuando una emergencia puede saturar las redes.",
      whyText: "Después de un sismo, las redes de comunicación pueden saturarse o fallar cuando muchas personas intentan utilizarlas al mismo tiempo. Por eso conviene conocer alternativas y prepararse antes de una emergencia.",
      whyKey: "Los SMS, la radio y la linterna no dependen de lo mismo y se complementan.",
      whyLead: "Una ciudad grande donde, tras un sismo, muchas personas intentan comunicarse al mismo tiempo.",
      whyPoints: ["Conocer alternativas de comunicación antes de una emergencia, como un sismo, ayuda a reaccionar con más calma.","Las redes pueden congestionarse o sufrir interrupciones cuando muchas personas las usan a la vez.","Por eso sirve conocer los SMS, la radio y la linterna: no dependen de lo mismo y se complementan."],
      whyFact: "Según la Alcaldía de Cali (presentación de 2020), es la única ciudad de Colombia con más de un millón de habitantes en zona de amenaza sísmica alta.",
      whyRef: "Fuente: Alcaldía de Santiago de Cali",
      quake: true,
      items: {
        telefono: {
          kicker: "Teléfono celular · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer el teléfono en Cali. Ninguna de estas acciones garantiza una conexión: dependen de la red y del operador.",
          objects: [
            {
              id: "sms", name: "SMS breves", label: "SMS", sms: true,
              icon: "sms", tutorial: {"title":"Tutorial: cómo redactar y enviar un SMS (simulado)","steps":["Toca el icono «Mensajes» en la pantalla de inicio del teléfono de práctica.","Se abre la interfaz de SMS: verás un campo para el número y otro para el mensaje.","Escribe un número de celular ficticio con el teclado numérico (o usa el número de ejemplo). No es un número real.","Toca el campo del mensaje y escríbelo con el teclado virtual. Ejemplo: «Estoy bien. Estoy en un lugar seguro. Te escribiré cuando pueda». Puedes borrar con ⌫, corregir el texto y volver a escribir.","Pulsa el botón de enviar (➤).","La pantalla muestra «Envío simulado». No se asegura que el mensaje haya sido recibido, porque no existe una conexión real. Puedes repetir el ejercicio."]},
              lead: "Un SMS es un mensaje de texto común y corriente. Lo escribes en la aplicación «Mensajes» de tu celular (el icono suele ser un globo de diálogo) y viaja por la red celular, sin internet.",
              intro: "Un SMS es un mensaje de texto corto, como los de siempre. Para escribirlo, abre en tu celular la aplicación «Mensajes» (también puede llamarse «SMS» o «Mensajería»; su icono suele ser un globo de diálogo). Allí eliges un número, escribes el texto y lo envías. A diferencia de muchas aplicaciones de mensajería, no necesita una conexión a internet, pero sí requiere que el servicio de mensajes y la red celular estén disponibles.",
              why: "Cuando muchas personas intentan llamar al mismo tiempo después de una emergencia, puede ser difícil comunicarse. Un mensaje breve puede ser una alternativa, aunque su entrega no está garantizada si la red está caída o saturada.",
              what: "En Cali, después de un sismo las redes pueden congestionarse. Prioriza mensajes breves con lo esencial (cómo estás, dónde estás y qué necesitas) y evita las llamadas innecesarias para no saturar más la línea de voz; MinTIC y la CRC recomiendan los mensajes de texto cuando las llamadas están congestionadas, es decir, cuando muchas personas llaman al mismo tiempo y las líneas se ocupan.",
              net: { internet: [0, "No la necesita para SMS"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Que el mensaje salga no garantiza que llegue ni que lo lean. Úsalo solo cuando sea seguro.",
              hint: "Sigue los pasos en el teléfono de práctica: no se envía nada real y el número es ficticio.",
              /* Historia (paso 3) y «Lo aprendido» (paso 4), en lugar del cuadro con mucho texto. Lo programa js/sequence.js (busca «historia»).
                 Las frases salen del contenido de arriba y del mensaje de ejemplo del tutorial; el texto completo sigue en «Saber más». */
              story: {
                kind: "sms", box: "Mensaje de Valeria",
                comment: "Después del sismo, las líneas están ocupadas. ¿Cómo aviso a mi familia que estoy bien?",   // lo primero que dice Valeria (globo), antes del panel
                busy: "Líneas ocupadas", busyNote: "Muchas personas llaman a la vez",
                task: "Ayuda a Valeria: toca solo lo esencial para su mensaje.",
                parts: [["como", "Cómo estás", "Estoy bien."], ["larga", "Contar todo lo que pasó", ""], ["donde", "Dónde estás", "Estoy en un lugar seguro."], ["cuando", "Cuándo escribirás", "Te escribiré cuando pueda."]],
                wrong: "Mejor no: prioriza lo esencial y mantenlo breve.",
                ready: "¡Listo! Toca ➤ para enviarlo (simulado).",
                sent: "Envío simulado", sentNote: "Que salga no garantiza que llegue",
                bubble: "Listo: corto y con lo esencial.",
                key: "Un SMS breve, con lo esencial (cómo estás, dónde estás y qué necesitas), puede ser una alternativa cuando las llamadas están congestionadas.",
                facts: [["no", "Internet", "No la necesita"], ["yes", "Red celular", "Sí la necesita"], ["warn", "Sin garantía", "Que salga no asegura que llegue"]]
              }
            },
            {
              id: "llamadas", name: "Llamadas breves", label: "Llamadas", call: true,
              lead: "Una llamada breve es hablar solo lo necesario (quién eres, dónde estás y qué necesitas) para no ocupar la línea más tiempo del que hace falta.",
              intro: "Una llamada de voz usa la red celular. Es la forma más directa de hablar con alguien, pero necesita una conexión estable y se satura cuando muchas personas llaman a la vez.",
              what: "Una llamada corta, con lo esencial, deja la línea libre para otras personas. El 123 es la línea única de emergencias y la llamada es gratuita, incluso sin saldo.",
              net: { internet: [0, "No la necesita"], cellular: [1, "Sí: necesita una red celular disponible"] },
              limit: "Solo funciona si hay conexión; con la red congestionada puede no completarse, y llamar al 123 no garantiza que entre.",
              hint: "Mira la llamada simulada: no se llama a nadie.",
              /* Historia «Cuelga a tiempo»: con el celular en la oreja, Valeria dice lo esencial mientras corre el reloj (ver «historia» en js/sequence.js).
                 Las tres frases de Valeria son ejemplos de la escena (el Gato de Tejada está en el escenario de Cali). */
              story: {
                kind: "call", box: "Lo que dijo Valeria",
                comment: "Necesito hablar con mi familia, pero mucha gente está llamando al mismo tiempo.",
                busy: "Líneas ocupadas", busyNote: "Muchas personas llaman a la vez",
                task: "La llamada entró. Toca solo lo esencial para que Valeria lo diga.",
                with: "En llamada con Familia", empty: "Toca lo que Valeria debe decir…", chipsLabel: "Lo que puede decir",
                parts: [["quien", "Quién eres", "Soy Valeria."], ["todo", "Contar todo con detalle", ""], ["donde", "Dónde estás", "Estoy junto al Gato de Tejada."], ["que", "Qué necesitas", "Estoy bien; por ahora no necesito ayuda."]],
                wrong: "Mejor no: así la línea queda ocupada más tiempo.",
                ready: "Ya dijo lo esencial. Cuelga para dejar la línea libre.",
                slow: "La línea sigue ocupada: cuelga ya para que otras personas puedan llamar.",
                action: "Colgar",
                liveChip: "En llamada", liveNote: "Cada segundo ocupa la línea",
                sent: "Línea libre", sentNote: "Otras personas pueden llamar",
                bubble: "Corto y claro: la línea queda libre.",
                key: "Una llamada breve, con lo esencial (quién eres, dónde estás y qué necesitas), deja la línea libre para otras personas.",
                facts: [["no", "Internet", "No la necesita"], ["yes", "Red celular", "Sí la necesita"], ["warn", "123", "Gratis, incluso sin saldo; no garantiza que entre"]]
              }
            },
            {
              /* Marcar 119 (reemplaza «Modo avión» solo en Cali; antes era «Mensajes de voz en emergencia»). Demostración simulada: no se llama a nada.
                 En Colombia se marca solo 119 (sin asterisco), según confirmó el equipo; en el país el 119 corresponde a Bomberos
                 y la línea 119 de mensajes de voz es un servicio de Perú (MTC). Confirmar con MinTIC, la CRC o los operadores antes de publicar.
                 La pantalla del teléfono la dibuja js/seq-modules.js (id "voz") y los controles, js/sequence.js (voiceHTML / voiceAct). */
              id: "voz", name: "Marcar 119 en emergencia", label: "Marcar 119", voice: true,
              introTitle: "¿Qué es el 119?",
              lead: "El 119 se marca desde la aplicación «Teléfono» del celular, como cualquier llamada. Aquí practicas los pasos con un teléfono de práctica.",
              intro: "Tras una emergencia las redes pueden congestionarse. El 119 es un número corto: abres «Teléfono», marcas 1, 1, 9 y pulsas llamar. En Colombia se marcan solo los números, sin asterisco.",
              what: "Si las líneas están ocupadas y no logras hablar con tu familia, marcar el 119 te permite dejar lo esencial: que estás bien, dónde estás y cuándo intentarás comunicarte otra vez. Sé breve y sigue las indicaciones de la grabación.",
              net: { internet: [0, "No la necesita"], cellular: [1, "Sí: necesita una red celular disponible"] },
              hint: "Sigue los pasos en el teléfono de práctica: no se llama a ningún número.",
              voiceTut: { title: "Práctica: cómo marcar el 119 (simulado)", steps: [
                "Toca la aplicación «Teléfono» (el icono del auricular) en la pantalla de inicio.",
                "En el teclado, toca 1, 1 y 9: en la pantalla debe verse 119. Solo se marcan los números, sin asterisco.",
                "Pulsa el botón verde para llamar.",
                "Escucha y sigue las indicaciones de la grabación. Di lo esencial: que estás bien, dónde estás y cuándo intentarás comunicarte otra vez.",
                "Pulsa el botón rojo para colgar."] },
              voiceSay: "Sigue las indicaciones de la grabación y di lo esencial, por ejemplo: «Estoy bien. Estoy en un lugar seguro. Intentaré comunicarme nuevamente».",
              /* Historia «Deja tu mensaje»: marca el 119, celular a la oreja y mantener presionado el micrófono para decir lo esencial (frases de voiceSay).
                 Mismo aviso que arriba: confirmar el servicio 119 en Colombia antes de publicar. */
              story: {
                kind: "voice", box: "Mensaje de Valeria",
                comment: "Las líneas están ocupadas y no logro hablar con mi familia. ¿Cómo les dejo un mensaje?",
                busy: "Líneas ocupadas", busyNote: "No logra hablar con su familia",
                dialTask: "Valeria abrió «Teléfono» y marcó 119. Toca llamar (simulado).", app: "«Teléfono»", callBtn: "Llamar (simulado)",
                task: "Mantén presionado el micrófono para que Valeria deje lo esencial.",
                with: "Llamada al 119", empty: "Mantén presionado el micrófono…",
                mic: "Mantén presionado para hablar", micDone: "Mensaje completo",
                say: ["Estoy bien.", "Estoy en un lugar seguro.", "Intentaré comunicarme nuevamente."],
                ready: "Dejó lo esencial. Ahora cuelga.",
                action: "Colgar",
                liveChip: "Llamada al 119", liveNote: "Sigue las indicaciones de la grabación",
                sent: "Llamada finalizada", sentNote: "Simulación: no se llamó a ningún número",
                bubble: "Dejé lo esencial.",
                key: "Si las líneas están ocupadas y no logras hablar con tu familia, marcar el 119 te permite dejar lo esencial: que estás bien, dónde estás y cuándo intentarás comunicarte otra vez.",
                facts: [["no", "Internet", "No la necesita"], ["yes", "Red celular", "Sí la necesita"], ["warn", "Sé breve", "Sigue las indicaciones de la grabación"]]
              }
            },
            {
              /* tipo de red preferido (5G / 4G / 3G): la pantalla del teléfono lo muestra en js/seq-modules.js (id "red") */
              id: "red", name: "Cambiar el tipo de red", label: "Tipo de red", network: true,
              lead: "En los ajustes del celular puedes elegir el tipo de red: 5G, 4G o 3G. Si una no funciona bien, a veces una red más básica sí permite llamar o enviar SMS.",
              introTitle: "¿Qué es el tipo de red?",
              intro: "Los celulares se conectan con distintas redes: 5G, 4G (LTE) y, en algunos lugares, 3G. Las más nuevas son más rápidas; las más básicas son lentas para internet, pero pueden bastar para llamar y enviar SMS.",
              what: "Si después de un sismo la red está saturada o la señal es débil, entra en los ajustes del celular («Redes móviles» › «Tipo de red preferido») y elige una red más básica. Cuando todo mejore, vuelve a la opción automática.",
              net: { internet: [0, "No es necesario para llamar ni para enviar SMS"], cellular: [1, "Sí: el cambio solo sirve si esa red existe en tu zona"] },
              limit: "No todos los teléfonos lo permiten, y en muchos lugares el 3G ya no existe. Cambiar de red no garantiza la conexión.",
              hint: "Usa «Cambiar a una red más básica (simulado)» y mira en la pantalla cómo el teléfono pasa de 5G a 3G. Es una ilustración: no cambia ningún ajuste de tu teléfono.",
              /* Historia «Baja de 5G a 3G»: con el celular en alto, elige una red más básica, espera la conexión y al final vuelve a la automática */
              story: {
                kind: "net", box: "Dónde está en el celular", boxText: ["Ajustes › Redes móviles › Tipo de red preferido"],
                comment: "Mi celular está en 5G, pero la señal es débil y no carga nada.",
                busy: "5G · señal débil", busyNote: "La red está saturada",
                task: "Ayuda a Valeria: elige una red más básica.",
                path: "Redes móviles › Tipo de red preferido",
                options: [["5g", "5G (automático)", "La más rápida"], ["4g", "4G / LTE", "Rápida"], ["3g", "3G", "Más lenta; llamadas y SMS"]],
                wrongs: { "5g": "Ya está en 5G y no funciona bien: elige una red más básica.", "4g": "4G también es más básica que 5G. En esta simulación, prueba la más básica: 3G." },
                searching: "Buscando la nueva red…",
                connected: "Conectado a 3G (simulado): internet lento, pero las llamadas y los SMS pueden funcionar.",
                backTask: "Cuando todo mejore, vuelve a la opción automática.",
                action: "Volver a automático (5G)",
                netChip: "3G (simulado)", netNote: "Llamadas y SMS posibles",
                sent: "Red automática (5G)", sentNote: "Cambiar de red no garantiza la conexión",
                bubble: "Listo: ya sé cambiar el tipo de red.",
                key: "Si la red está saturada o la señal es débil, una red más básica puede bastar para llamar y enviar SMS. Cuando todo mejore, vuelve a la automática.",
                facts: [["no", "Internet", "Más lento, y no hace falta para llamar ni para SMS"], ["yes", "Red celular", "Solo si esa red existe en tu zona"], ["warn", "Límite", "No todos los teléfonos lo permiten"]]
              }
            }
          ]
        },
        radio: {
          kicker: "Radio AM/FM · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer la radio en Cali. Recuerda que solo recibe información: no sirve para enviar mensajes ni pedir ayuda.",
          objects: [
            {
              id: "radio", name: "Radio AM/FM", label: "Radio", tuner: true,
              lead: "Una radio AM/FM solo recibe emisoras. Se enciende con su botón, se elige AM o FM y se ajusta la sintonía hasta oír una emisora con claridad.",
              intro: "Una radio AM/FM recibe las señales que emiten las emisoras y las convierte en sonido. Solo recibe: no transmite. Con pilas funciona sin internet ni red celular.",
              what: "Una radio portátil con pilas sigue funcionando durante un corte eléctrico y permite escuchar noticias e indicaciones difundidas por las emisoras, sin depender de internet ni de la red celular.",
              net: { internet: [0, "No la necesita"], cellular: [0, "No la necesita"] },
              limit: "Sirve para recibir información, no para enviar mensajes ni solicitar ayuda. Necesita pilas y que haya emisoras al aire.",
              hint: "Presiona los botones de arriba: encender, AM/FM, sintonía − y + y buscar emisora."
            }
          ]
        },
        linterna: {
          kicker: "Linterna · Urbanidad — Cali · Después del sismo",
          bye: "Gracias por recorrer la linterna en Cali. Una señal de luz solo sirve si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
          guided: true,
          guide: {
            "s1": {
              "title": "Una luz también puede comunicar",
              "morse": "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              "text": "Cuando no puedes comunicarte por una llamada o un mensaje, los destellos de una linterna pueden ayudarte a transmitir una señal."
            },
            "s2": {
              "title": "Destello corto y destello largo",
              "text": "En el código Morse, las letras se representan combinando señales cortas y largas. Con una linterna, enciendes la luz con su botón: si lo sueltas enseguida (cerca de 0,2 segundos) haces un destello corto, y si lo mantienes presionado (cerca de 0,6 segundos) haces un destello largo. Entre un destello y otro, deja la luz apagada un instante."
            },
            "s3": {
              "title": "La señal SOS",
              "text": "SOS es una señal internacional de socorro. En código Morse se forma así: S = tres destellos cortos, O = tres destellos largos y S = tres destellos cortos.",
              "msg": "Para pedir ayuda, puedes repetir la señal SOS con una linterna e intentar que sea visible para otras personas.",
              "note": "La señal solo será útil si alguien puede verla y reconocerla, y no garantiza recibir ayuda.",
              "zone": "Después de un sismo, una linterna puede ayudarte a iluminar el entorno y, si necesitas pedir ayuda, transmitir una señal visual. Evita acercarte a estructuras inestables y sigue las indicaciones de las autoridades."
            },
            "p": {
              "title": "Practica la señal",
              "text": "Pulsa «Destello corto» o «Destello largo», reproduce el SOS, o mantén presionado el interruptor de la linterna: se enciende mientras lo sostienes y se apaga al soltarlo. Es solo una práctica: no se envía nada."
            }
          },
          objects: [
            {
              id: "escena", name: "Linterna y código Morse", label: "Linterna", toggle: true, whatTitle: "¿Cómo ayuda?",
              lead: "La linterna se enciende al presionar su botón de encendido. Si lo presionas poco rato haces un destello corto, y si lo mantienes más, un destello largo.",
              intro: "El código Morse es un sistema que representa letras, números y signos con solo dos señales: cortas (puntos) y largas (rayas). Se puede enviar con luz, con sonido o con golpes. Con una linterna, el destello largo dura aproximadamente tres veces lo que dura el corto.",
              what: "Una linterna permite enviar señales visuales sin depender de una conexión a internet o de una red celular. Mediante el código Morse, puedes transmitir señales como SOS a personas que estén dentro del alcance visual.",
              limit: "Necesitas una linterna con batería, un entorno en el que los destellos puedan verse y una persona capaz de reconocer la señal. La luz puede quedar oculta por obstáculos, la distancia o las condiciones ambientales. El código Morse no sustituye los servicios de emergencia ni garantiza una respuesta.",
              hint: "Enciende y apaga la linterna, o mantén presionado el interruptor para formar puntos y rayas."
            }
          ]
        }
      }
    }
  },

  /* Los tres objetos (el modelo 3D se construye en js/hub.js y js/seq-modules.js) */
  journeys: {
    telefono: { id: "telefono", module: "phone", name: "Teléfono celular", short: "Teléfono", flatImg: "assets/objects/celular.svg" },
    radio: { id: "radio", module: "radio", name: "Radio portátil AM/FM", short: "Radio", flatImg: "assets/objects/radio.svg" },
    linterna: { id: "linterna", module: "torch", name: "Linterna", short: "Linterna", flatImg: "assets/objects/linterna.svg" }
  },

  /* Menú de objetos de cada zona: los tres objetos 3D */
  menu: [
    { id: "telefono", model: "phone", name: "Teléfono celular", img: "assets/objects/celular.svg",
      text: "Permite enviar SMS, realizar llamadas breves e intentar reconectarse a una red disponible. Estas opciones requieren cobertura celular para funcionar y pueden fallar durante una emergencia." },
    { id: "radio", model: "radio", name: "Radio AM/FM", img: "assets/objects/radio.svg",
      text: "Permite escuchar noticias e indicaciones de las autoridades cuando las redes celulares o internet fallan. Una radio portátil con pilas puede funcionar durante un corte de electricidad, siempre que exista una emisora disponible." },
    { id: "linterna", model: "torch", name: "Linterna", img: "assets/objects/linterna.svg",
      text: "Permite iluminar espacios oscuros, facilitar el desplazamiento y hacer más visibles los obstáculos cuando falla la electricidad. Puede ayudar a orientarse sin depender de la señal celular." }
  ],

  /* Simulación del sismo (al entrar a la zona urbana, Cali; la zona rural entra directo a la información) */
  quake: {
    during: "Durante el movimiento",
    duringText: "Simulación de un sismo. Lo primero es protegerte: cubre tu cabeza y aléjate de vidrios y objetos que puedan caer. No es momento de usar el teléfono.",
    after: "El movimiento terminó",
    afterText: "Cuando sea seguro, así puedes intentar comunicarte después del sismo. Las redes pueden estar saturadas o caídas y ninguna alternativa garantiza una conexión.",
    cont: "Continuar con las explicaciones",
    skip: "Saltar simulación",
    again: "Ver la simulación del sismo",
    still: "Simulación en reposo (movimiento reducido): la escena no se mueve."
  },

  /* Sintonizador ilustrativo de la radio (no usa frecuencias ni emisoras reales). pos = posición en el dial (0–100). */
  tuner: {
    title: "Sintoniza la radio",
    note: "Simulación ilustrativa: no usa frecuencias ni emisoras reales. En la vida real depende de que haya emisoras al aire en tu zona.",
    off: "La radio está apagada. Enciéndela (necesita pilas) y mueve el dial.",
    noise: "Solo ruido: aquí no hay emisora. Sigue moviendo el dial.",
    near: "Se oye algo entre el ruido… acércate un poco más.",
    start: { on: false, band: "AM", pos: 8 },
    demo: { band: "AM", pos: 24 },   // posición en que termina la demostración del primer plano
    bands: {
      AM: [
        { pos: 24, kind: "info", name: "Emisora de ejemplo", msg: "Boletín de ejemplo: «Mantenga la calma y siga las indicaciones de las autoridades.»" }
      ],
      FM: [
        { pos: 38, kind: "info", name: "Emisora de ejemplo", msg: "Boletín de ejemplo: «Escuche con calma y espere nuevas indicaciones oficiales.»" }
      ]
    }
  },

  /* Sección final y de fuentes */
  final: {
    /* reto final: reemplaza «Lo que descubriste». La respuesta se guarda solo en este navegador (localStorage) */
    quiz: {
      kicker: "Pon a prueba lo que aprendiste",
      question: "Ocurre un sismo, la red celular está saturada y no logras llamar a tu familia. ¿Qué harías para comunicarte y mantenerte informado? Explica qué alternativa usarías y por qué.",
      placeholder: "Escribe tu respuesta aquí…",
      save: "Guardar mi respuesta",
      saved: "Respuesta guardada en este navegador.",
      empty: "Escribe una respuesta antes de guardarla.",
      hintTitle: "Compara con estas ideas",
      hint: ["Un SMS breve con lo esencial (estoy bien, dónde estoy) suele salir aunque las llamadas no entren.", "La radio a pilas te da información oficial sin internet ni red celular.", "La linterna te ayuda a moverte con cuidado y a hacerte visible; el 123 es para emergencias reales."]
    },
    title: "Prepárate antes de que falle la señal",
    lead: "Ninguna de estas tres alternativas lo resuelve todo. Funcionan mejor combinadas y probadas con tiempo.",
    columns: [
      { title: "Antes", items: [
        "Ten a mano una radio portátil y una linterna con pilas.",
        "Averigua en qué puntos de tu zona suele haber señal y qué emisoras se oyen."
      ] },
      { title: "Durante", items: [
        "Primero protégete. Después, si es seguro y hay señal, prefiere un SMS corto: usa poca red y puede salir aunque una llamada no se complete. Las llamadas breves solo funcionan si hay cobertura, y el 123 es solo para emergencias reales. Si no hay señal, escucha la radio y usa la linterna.",
        "Escucha la radio para recibir información oficial y alumbra el suelo para moverte con cuidado."
      ] },
      { title: "Después", items: [
        "Avisa que estás bien con un mensaje corto e indica la hora en que lo escribes (por ejemplo, «Estoy bien, 3:40 p. m.»): con fallas de señal puede llegar tarde.",
        "Para buscar a un familiar, acude a la Cruz Roja Colombiana y su servicio de restablecimiento de contacto."
      ] }
    ],
    sourcesTitle: "Fuentes y créditos",
    sourcesLead: "Contenido revisado en octubre de 2026 con información de estas entidades (se consultaron resúmenes que las citan; consulta siempre sus canales oficiales, porque esta experiencia es educativa y no reemplaza las indicaciones de las autoridades):",
    sources: [
      { name: "UNGRD — Unidad Nacional para la Gestión del Riesgo de Desastres", site: "gestiondelriesgo.gov.co", use: "Qué hacer durante un sismo y kit de emergencia (linterna, pilas, radio a pilas)." },
      { name: "MinTIC — Ministerio de Tecnologías de la Información y las Comunicaciones", site: "mintic.gov.co", use: "Línea única de emergencias 123 y uso de mensajes de texto cuando la voz se congestiona." },
      { name: "INTERNEXA", site: "internexa.com", use: "Infraestructura de conectividad y telecomunicaciones en Colombia y la región." }
    ],
    credits: ""
  }
};
