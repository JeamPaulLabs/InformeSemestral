// Archivo autogenerado por 13_actualizar_jul_ago.py (extiende 07_analisis_retail_tradicional.py a Ene-Ago)
// Contiene la base de datos completa para la presentación del Canal Retail 2026.
const RETAIL_DATA = {
  visitas: [
  {
    "mes": "Ene",
    "visitas": 81,
    "asesores": 71,
    "pdvs": 56
  },
  {
    "mes": "Feb",
    "visitas": 74,
    "asesores": 65,
    "pdvs": 52
  },
  {
    "mes": "Mar",
    "visitas": 75,
    "asesores": 71,
    "pdvs": 45
  },
  {
    "mes": "Abr",
    "visitas": 76,
    "asesores": 61,
    "pdvs": 36
  },
  {
    "mes": "May",
    "visitas": 37,
    "asesores": 33,
    "pdvs": 19
  },
  {
    "mes": "Jun",
    "visitas": 30,
    "asesores": 25,
    "pdvs": 14
  },
  {
    "mes": "Jul",
    "visitas": 28,
    "asesores": 24,
    "pdvs": 14
  },
  {
    "mes": "Ago",
    "visitas": 31,
    "asesores": 30,
    "pdvs": 18
  }
],
  ventas: {
    cp: [
  {
    "mes": "Ene",
    "gestores": 147,
    "pdv": 91,
    "cantadas": 1953,
    "efectivas": 1614,
    "corte": "CIERRE"
  },
  {
    "mes": "Feb",
    "gestores": 146,
    "pdv": 90,
    "cantadas": 2298,
    "efectivas": 1798,
    "corte": "CIERRE"
  },
  {
    "mes": "Mar",
    "gestores": 135,
    "pdv": 82,
    "cantadas": 3344,
    "efectivas": 2474,
    "corte": "corte 30"
  },
  {
    "mes": "Abr",
    "gestores": 118,
    "pdv": 72,
    "cantadas": 2731,
    "efectivas": 2177,
    "corte": "CIERRE"
  },
  {
    "mes": "May",
    "gestores": 93,
    "pdv": 57,
    "cantadas": 3116,
    "efectivas": 2443,
    "corte": "CIERRE"
  },
  {
    "mes": "Jun",
    "gestores": 96,
    "pdv": 52,
    "cantadas": 2620,
    "efectivas": 2182,
    "corte": "CIERRE"
  },
  {
    "mes": "Jul",
    "gestores": 95,
    "pdv": 48,
    "cantadas": 2592,
    "efectivas": 2100,
    "corte": "corte 31"
  },
  {
    "mes": "Ago",
    "gestores": 90,
    "pdv": 51,
    "cantadas": 2185,
    "efectivas": 1122,
    "corte": "corte 16"
  }
],
    rs: [
  {
    "mes": "Ene",
    "gestores": 148,
    "pdv": 91,
    "cantadas": 63,
    "efectivas": 34
  },
  {
    "mes": "Feb",
    "gestores": 139,
    "pdv": 90,
    "cantadas": 120,
    "efectivas": 65
  },
  {
    "mes": "Mar",
    "gestores": 135,
    "pdv": 82,
    "cantadas": 169,
    "efectivas": 122
  },
  {
    "mes": "Abr",
    "gestores": 118,
    "pdv": 72,
    "cantadas": 120,
    "efectivas": 91
  },
  {
    "mes": "May",
    "gestores": 93,
    "pdv": 57,
    "cantadas": 103,
    "efectivas": 70
  },
  {
    "mes": "Jun",
    "gestores": 96,
    "pdv": 52,
    "cantadas": 100,
    "efectivas": 85
  },
  {
    "mes": "Jul",
    "gestores": 95,
    "pdv": 48,
    "cantadas": 88,
    "efectivas": 78
  },
  {
    "mes": "Ago",
    "gestores": 90,
    "pdv": 51,
    "cantadas": 43,
    "efectivas": 35
  }
]
  },
  mapa: [
  {
    "name": "Bogotá Centro",
    "lat": 4.628,
    "lon": -74.075,
    "visits": 129
  },
  {
    "name": "Bogotá Sur",
    "lat": 4.59,
    "lon": -74.15,
    "visits": 94
  },
  {
    "name": "Bogotá Occidente",
    "lat": 4.665,
    "lon": -74.125,
    "visits": 51
  },
  {
    "name": "Tunja",
    "lat": 5.5353,
    "lon": -73.3678,
    "visits": 33
  },
  {
    "name": "Bucaramanga",
    "lat": 7.1193,
    "lon": -73.1227,
    "visits": 25
  },
  {
    "name": "Soacha",
    "lat": 4.5781,
    "lon": -74.2158,
    "visits": 24
  },
  {
    "name": "Bogotá Norte",
    "lat": 4.73,
    "lon": -74.055,
    "visits": 23
  },
  {
    "name": "Sogamoso",
    "lat": 5.7148,
    "lon": -72.9339,
    "visits": 15
  },
  {
    "name": "Mosquera",
    "lat": 4.7059,
    "lon": -74.2302,
    "visits": 14
  },
  {
    "name": "Chía",
    "lat": 4.8632,
    "lon": -74.0514,
    "visits": 9
  },
  {
    "name": "Facatativá",
    "lat": 4.8136,
    "lon": -74.3541,
    "visits": 8
  },
  {
    "name": "Zipaquirá",
    "lat": 5.0267,
    "lon": -74.0039,
    "visits": 7
  }
]
};

// Cobertura de PDV visitados vs. PDV con gestión activa en CP, por mes.
const COBERTURA_PDV = [
  {
    "mes": "Ene",
    "gestores": 147,
    "gestion": 91,
    "visitas": 56,
    "pct": 61.5
  },
  {
    "mes": "Feb",
    "gestores": 146,
    "gestion": 90,
    "visitas": 52,
    "pct": 57.8
  },
  {
    "mes": "Mar",
    "gestores": 135,
    "gestion": 82,
    "visitas": 45,
    "pct": 54.9
  },
  {
    "mes": "Abr",
    "gestores": 118,
    "gestion": 72,
    "visitas": 36,
    "pct": 50.0
  },
  {
    "mes": "May",
    "gestores": 93,
    "gestion": 57,
    "visitas": 19,
    "pct": 33.3
  },
  {
    "mes": "Jun",
    "gestores": 96,
    "gestion": 52,
    "visitas": 14,
    "pct": 26.9
  },
  {
    "mes": "Jul",
    "gestores": 95,
    "gestion": 48,
    "visitas": 14,
    "pct": 29.2
  },
  {
    "mes": "Ago",
    "gestores": 90,
    "gestion": 51,
    "visitas": 18,
    "pct": 35.3
  }
];
