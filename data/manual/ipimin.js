// INDEC – Índice de Producción Industrial Minero (IPI minero), base 2016 = 100.
// Separa lo que el EMAE junta en «Explotación de minas y canteras»: petróleo y gas por un lado, minería por otro.
// Carga manual desde el informe de prensa; la serie mensual completa está en serie_ipi_minero.xlsx (ver fuente).
Object.assign(SRC, {
  ipiMin: { t:"INDEC – Índice de producción industrial minero, septiembre de 2026 (informe del 6-nov-2026)", u:"https://www.indec.gob.ar/uploads/informesdeprensa/ipi_minero_11_261447EF4B70.pdf" },
  ipiMinSerie: { t:"INDEC – IPI minero, serie mensual desde enero de 2017 (Excel)", u:"https://www.indec.gob.ar/ftp/cuadros/economia/serie_ipi_minero.xlsx" }
});
// i: índice (2016 = 100), a: variación interanual %, y: acumulado del año %, q: volumen físico del mes
const IPIMIN = {
  mes: "2026-09", s: "ipiMin",
  gral:  { n:"IPI minero, nivel general", i:146.2, a:7.1, y:7.8 },
  og: [
    { k:"pg",  n:"Petróleo, gas y servicios de apoyo", i:156.8, a:8.0,  y:6.4, tot:true },
    { k:"oil", n:"Petróleo crudo",                     i:185.8, a:15.6, y:16.3, q:"4.599 mil m³ en el mes" },
    { k:"gas", n:"Gas natural",                        i:114.3, a:3.1,  y:0.7,  q:"4.287 millones de m³ en el mes" },
    { k:"srv", n:"Servicios de apoyo a la extracción", i:129.3, a:-9.4, y:-13.1 }
  ],
  mi: [
    { k:"met", n:"Minerales metalíferos",             i:46.0,  a:-18.1, y:-3.4, tot:true, nota:"Incluye oro, plata, cobre, hierro, plomo y cinc" },
    { k:"au",  n:"Oro y plata (concentrados)",        i:108.7, a:-23.7, y:-4.2 },
    { k:"li",  n:"Carbonato de litio y otros de litio", i:473.3, a:15.7, y:40.7, q:"9.798 t de carbonato de litio en el mes" },
    { k:"nm",  n:"No metalíferos y rocas de aplicación", i:206.0, a:13.6, y:29.5, nota:"Incluye el litio, la sal, arenas y piedra caliza" }
  ]
};
