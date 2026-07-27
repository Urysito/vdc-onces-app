# Onces Probables — pre-plataforma de VDC ENGINE

App web (sin instalación) para organizar los onces probables de los 20 equipos
desde el móvil, el iPad o donde sea, y luego pasarlo a mano a VDC ENGINE.

Son 4 ficheros estáticos (`index.html`, `style.css`, `data.js`, `app.js`) +
`firebase-config.js` que rellenas tú. No hace falta servidor propio: se aloja
gratis en GitHub Pages y los datos se guardan en Firestore (gratis también),
para que se sincronicen entre tu móvil y tu iPad en tiempo real.

## 1. Crear el proyecto de Firebase (10 minutos, gratis, sin tarjeta)

La app queda protegida con login: solo tú (con tu email y contraseña) puedes
ver o tocar los datos y las fotos, aunque el código sea público en GitHub.
Todo esto va en el plan gratuito (Spark) de Firebase — no hace falta dar
ninguna tarjeta. Las fotos no usan Firebase Storage (eso sí exige activar
facturación) — se comprimen a miniatura en el propio móvil y se guardan como
texto dentro de Firestore, que es gratis.

1. Ve a https://console.firebase.google.com/ y **Crear un proyecto** (ponle el
   nombre que quieras, p.ej. `vdc-onces`). No hace falta activar Google
   Analytics.
2. **Firestore Database** (menú lateral → Compilación → Firestore Database →
   Crear base de datos). Modo de producción, región más cercana (p.ej.
   `eur3 (europe-west)`).
3. **Authentication** (Compilación → Authentication → Comenzar). En la
   pestaña **Sign-in method**, activa el proveedor **Correo
   electrónico/contraseña**. Luego, pestaña **Users → Add user**: crea tu
   único usuario (el email y contraseña con los que entrarás desde el móvil).
   No hace falta ningún formulario de registro en la app — este usuario lo
   creas tú a mano, una vez, aquí.
4. **Reglas de Firestore** (dentro de Firestore Database → pestaña Reglas) —
   pega esto y **Publicar**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   Con `request.auth != null` nadie puede leer ni escribir nada (ni ver las
   fotos, que van dentro de los mismos documentos) sin haber iniciado sesión
   con el usuario que has creado en el paso 3 — y como no hay formulario
   público de registro, nadie puede crearse una cuenta por su cuenta.
5. Ve a **⚙️ Configuración del proyecto → General**, baja hasta "Tus apps",
   pulsa el icono `</>` (Web), ponle un nombre y **Registrar app**. Te
   mostrará un objeto `firebaseConfig` — cópialo.
6. Abre `firebase-config.js` y sustituye los valores `PON_AQUI_...` por los
   que te ha dado Firebase.

## 2. Subir esto a GitHub Pages (5 minutos, gratis)

1. Crea un repositorio nuevo en GitHub (puede ser privado o público — si es
   privado necesitas GitHub Pro para activar Pages en él, así que si no lo
   tienes, hazlo público; no hay nada sensible en el código, la seguridad
   real la da el paso de Firebase).
2. Sube estos 5 ficheros a la raíz del repo (`index.html`, `style.css`,
   `data.js`, `app.js`, `firebase-config.js` ya con tus claves).
3. En el repo: **Settings → Pages → Source: Deploy from a branch → Branch:
   main / (root)** → Guardar.
4. En 1-2 minutos tendrás tu URL: `https://tu-usuario.github.io/tu-repo/`.
   Ábrela en el móvil y guárdala en la pantalla de inicio (Safari/Chrome →
   "Añadir a pantalla de inicio") para que se sienta como una app.

## 3. Fotos de los jugadores

No hace falta subir nada a GitHub ni activar Storage. Al crear o editar un
jugador en la app, el campo "Foto" te deja elegir una imagen directamente
desde la galería o cámara del móvil/iPad — la app la comprime a una
miniatura pequeña ahí mismo, en tu navegador, y la guarda como texto dentro
de tu base de datos privada (protegida por el login del paso 1). Si un
jugador no tiene foto, la app usa un icono genérico — no pasa nada por
dejarlo en blanco.

## 4. Uso del día a día

- Al abrir la app te pide **email y contraseña** (los que creaste en el paso
  1.3) — es la única forma de entrar, así que los datos y las fotos quedan
  privados. Botón "Salir" en la cabecera para cerrar sesión.
- Arriba, pestañas para elegir equipo (las 20 de siempre).
- Panel **Plantilla**: añade una vez los jugadores del equipo (nombre,
  posición, foto opcional). Es un trabajo de una sola vez por equipo — luego
  solo lo actualizas si hay fichajes.
- Panel **Once probable**: elige formación (las mismas 8 que en VDC ENGINE) y
  toca cualquier posición del campo para asignar titular, hasta 3
  alternativas ("duda"), el % de titularidad y si está en racha 🔥 (máximo 3
  por equipo, igual que en VDC ENGINE).
- Todo se guarda solo al pulsar "Guardar" en cada modal — no hay que darle a
  ningún botón general de guardar.
- **"Resetear once"** vacía las 11 posiciones del equipo actual (pide
  confirmación).

## 5. Pasar los datos a VDC ENGINE

Botón **"Ver JSON para VDC ENGINE"**: te saca el JSON de los 20 equipos con
el mismo formato que `vdc_save.json` (mismas claves: `formacion` y `slots`
del 1 al 11, cada uno con `jugador_main`, `jugadores_duda`, `porcentaje` y
`on_fire`). Cópialo y pega a mano lo que necesites en tu `vdc_save.json`
local — las fotos aquí son miniaturas comprimidas (no rutas de fichero), así
que para esa parte simplemente usas el nombre del jugador para reasignar la
carta real desde la pestaña REVISAR CARTAS / el selector de VDC ENGINE.

## Notas

- Cada equipo se guarda y sincroniza por separado (documento propio en
  Firestore), así que puedes estar editando el Athletic desde el móvil y el
  Barça desde el iPad sin que se pisen.
- Si algo no carga, el indicador de arriba a la derecha ("sincronizado ✓" /
  "sin conexión") te dice si el problema es `firebase-config.js`.
