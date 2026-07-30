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

// Coordenadas fijas (top%, left%) de las 11 posiciones para cada formación,
// diseñadas a mano línea por línea (portero abajo, delanteros arriba) —
// nada de fórmula genérica: cada formación tiene su propia disposición
// pensada para que se vea con sentido futbolístico.
const FORMACIONES = {
  "4-2-3-1": [
    { top: 90, left: 50 },
    { top: 72, left: 10 }, { top: 72, left: 37 }, { top: 72, left: 63 }, { top: 72, left: 90 },
    { top: 56, left: 30 }, { top: 56, left: 70 },
    { top: 32, left: 20 }, { top: 32, left: 50 }, { top: 32, left: 80 },
    { top: 14, left: 50 },
  ],
  "4-4-3": [
    { top: 90, left: 50 },
    { top: 72, left: 10 }, { top: 72, left: 37 }, { top: 72, left: 63 }, { top: 72, left: 90 },
    { top: 46, left: 20 }, { top: 46, left: 50 }, { top: 46, left: 80 },
    { top: 14, left: 20 }, { top: 14, left: 50 }, { top: 14, left: 80 },
  ],
  "4-1-4-1": [
    { top: 90, left: 50 },
    { top: 72, left: 10 }, { top: 72, left: 37 }, { top: 72, left: 63 }, { top: 72, left: 90 },
    { top: 58, left: 50 },
    { top: 34, left: 10 }, { top: 34, left: 37 }, { top: 34, left: 63 }, { top: 34, left: 90 },
    { top: 14, left: 50 },
  ],
  "4-4-2": [
    { top: 90, left: 50 },
    { top: 72, left: 10 }, { top: 72, left: 37 }, { top: 72, left: 63 }, { top: 72, left: 90 },
    { top: 46, left: 10 }, { top: 46, left: 37 }, { top: 46, left: 63 }, { top: 46, left: 90 },
    { top: 16, left: 30 }, { top: 16, left: 70 },
  ],
  "4-4-2 ROMBO": [
    { top: 90, left: 50 },
    { top: 74, left: 10 }, { top: 74, left: 37 }, { top: 74, left: 63 }, { top: 74, left: 90 },
    { top: 58, left: 50 },
    { top: 42, left: 25 }, { top: 42, left: 75 },
    { top: 26, left: 50 },
    { top: 12, left: 30 }, { top: 12, left: 70 },
  ],
  "3-4-1-2": [
    { top: 90, left: 50 },
    { top: 72, left: 20 }, { top: 72, left: 50 }, { top: 72, left: 80 },
    { top: 48, left: 10 }, { top: 48, left: 37 }, { top: 48, left: 63 }, { top: 48, left: 90 },
    { top: 28, left: 50 },
    { top: 12, left: 30 }, { top: 12, left: 70 },
  ],
  "5-2-3": [
    { top: 90, left: 50 },
    { top: 72, left: 10 }, { top: 72, left: 28 }, { top: 72, left: 50 }, { top: 72, left: 72 }, { top: 72, left: 90 },
    { top: 44, left: 30 }, { top: 44, left: 70 },
    { top: 14, left: 20 }, { top: 14, left: 50 }, { top: 14, left: 80 },
  ],
  "3-4-3": [
    { top: 90, left: 50 },
    { top: 72, left: 20 }, { top: 72, left: 50 }, { top: 72, left: 80 },
    { top: 46, left: 10 }, { top: 46, left: 37 }, { top: 46, left: 63 }, { top: 46, left: 90 },
    { top: 14, left: 20 }, { top: 14, left: 50 }, { top: 14, left: 80 },
  ],
};

// Niveles de "duda" (probabilidad de titularidad), igual que en VDC ENGINE.
const PORCENTAJES = [95, 90, 80, 70, 60, 50];

// Mismos colores que VDC ENGINE para cada nivel de % (PCT_COLORS).
const PCT_COLORS = {
  95: { bg: "#b8860b", text: "#fff8dc" }, // oro/dorado
  90: { bg: "#9b59b6", text: "#ffffff" }, // lila
  80: { bg: "#e91e8c", text: "#ffffff" }, // fucsia
  70: { bg: "#f48fb1", text: "#1a1a2e" }, // rosa
  60: { bg: "#e06010", text: "#ffffff" }, // naranja
  50: { bg: "#cc1111", text: "#ffffff" }, // rojo
};

const POSICIONES = ["Portero", "Defensa", "Centrocampista", "Delantero"];
