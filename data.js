// data.js — Datos fijos de la app (equipos y formaciones).
// Mismos nombres de equipo y de formación que usa VDC ENGINE, para que el
// JSON que exportes aquí se pueda pegar/leer directamente allí sin traducir nada.

const EQUIPOS = [
  "ATHLETIC CLUB",
  "ATLÉTICO DE MADRID",
  "CA OSASUNA",
  "CELTA",
  "DEPORTIVO ALAVÉS",
  "ELCHE CF",
  "FC BARCELONA",
  "GETAFE CF",
  "DEPORTIVO DE LA CORUÑA",
  "LEVANTE UD",
  "RAYO VALLECANO",
  "RCD ESPANYOL",
  "MÁLAGA CF",
  "REAL BETIS",
  "REAL MADRID",
  "RACING DE SANTANDER",
  "REAL SOCIEDAD",
  "SEVILLA FC",
  "VALENCIA CF",
  "VILLARREAL CF",
];

// Cada formación se describe como líneas de jugadores desde la portería (GK)
// hacia arriba (delanteros). El campo se dibuja repartiendo cada línea en
// horizontal. No son las coordenadas de OBS (esas son pixeles fijos para un
// canvas concreto) — aquí generamos la disposición al vuelo, así que vale
// para cualquier tamaño de pantalla (móvil, iPad, etc).
const FORMACIONES = {
  "4-2-3-1":   [4, 2, 3, 1],
  "4-4-3":     [4, 3, 3],
  "4-1-4-1":   [4, 1, 4, 1],
  "4-4-2":     [4, 4, 2],
  "4-4-2 ROMBO": [4, 1, 2, 1, 2],
  "3-4-1-2":   [3, 4, 1, 2],
  "5-2-3":     [5, 2, 3],
  "3-4-3":     [3, 4, 3],
};

// Niveles de "duda" (probabilidad de titularidad), igual que en VDC ENGINE.
const PORCENTAJES = [95, 90, 80, 70, 60, 50];

const POSICIONES = ["Portero", "Defensa", "Centrocampista", "Delantero"];
