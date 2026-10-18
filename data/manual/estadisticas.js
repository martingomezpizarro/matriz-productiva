// Indicadores y rankings por sector (cifras publicadas, con período y fuente).
// Archivo de datos de Matriz Productiva. Ver README → «Datos».
const STATS = {
  og: {
    kpis: [
      { v:"939.422", u:"bbl/d", l:"Producción de petróleo", p:"ago-2026, récord · suma oficial pozo por pozo", s:"cap4" },
      { v:"668.487", u:"bbl/d", l:"No convencional en Neuquén", p:"ago-2026 · 71,2% del petróleo del país", s:"cap4" },
      { v:"155,1", u:"MMm³/d", l:"Producción de gas", p:"ago-2026", s:"cap4" },
      { v:"5.722", u:"US$ M", l:"Exportaciones de crudo", p:"ene–jul 2026 · +59,2% i.a.", s:"infPet" },
      { v:"6.853", u:"US$ M", l:"Superávit energético", p:"ene–jul 2026 (3.669 en 2025)", s:"infPet" },
      { v:"11.300", u:"US$ M", l:"Exportaciones energéticas proyectadas", p:"2026, con Brent promedio de US$ 82", s:"infPet" }
    ],
    charts: [
      { t:"Producción de petróleo, mes a mes", sub:"Barriles por día, 2026 (suma oficial de todos los pozos)", u:"bbl/d", s:"cap4",
        rows:[["Enero",884705],["Febrero",875869],["Marzo",879552],["Abril",895447],["Mayo",903980],["Junio",913136],["Julio",918074],["Agosto",939422]] },
      { t:"Áreas con más petróleo", sub:"Barriles por día, agosto 2026", u:"bbl/d", s:"cap4",
        rows:[["Loma Campana (YPF)",92451,"og-lc"],["La Amarga Chica (YPF)",82541,"og-lac"],["Bandurria Sur (YPF)",72205,"og-bs"],["Cerro Dragón (PAE)",64737,"og-cd"],["Bajada del Palo Oeste (Vista)",58747,"og-bdpo"],["Bajo del Choique – La Invernada (Pluspetrol)",46594,"og-bdc"],["La Angostura Sur I (YPF)",46038],["La Calera (Pluspetrol)",31539],["El Trapial Este (Chevron)",24381],["Manantiales Behr (PECOM)",23499],["Rincón de Aranda (Pampa)",20117,"og-rda"]] },
      { t:"Áreas con más gas", sub:"Millones de m³ por día, agosto 2026", u:"MMm³/d", s:"cap4",
        rows:[["Cuenca Marina Austral 1 (TotalEnergies)",21.0,"og-fenix"],["Fortín de Piedra (Tecpetrol)",20.53,"og-fp"],["La Calera (Pluspetrol)",13.65],["Aguada Pichana Este (TotalEnergies)",12.73,"og-ape"],["Aguada Pichana Oeste (PAE)",9.59],["Sierra Chata (Pampa)",8.85],["Rincón del Mangrullo (YPF)",5.01],["El Mangrullo (Pampa)",4.97],["Cerro Dragón (PAE)",4.76,"og-cd"],["Loma La Lata – Sierra Barrosa (YPF)",4.31,"og-lll"]] },
      { t:"Operadores con más petróleo", sub:"Barriles por día operados, agosto 2026", u:"bbl/d", s:"cap4",
        rows:[["YPF",367713],["Pan American Energy",104314],["Pluspetrol",94913],["Vista Energy",81531],["Shell",42762],["PECOM",32451],["Phoenix Global Resources",25265],["Chevron",24381],["Tecpetrol",22574],["Pampa Energía",20271]] }
    ]
  },
  mi: {
    kpis: [
      { v:"6.059", u:"US$ M", l:"Exportaciones mineras", p:"ene–ago 2026 · +65,7% i.a. (6.074 en todo 2025)", s:"expMin" },
      { v:"120.000", u:"t LCE", l:"Producción de litio", p:"2025 · +62% i.a. · 7 proyectos en operación", s:"litLN" },
      { v:"573.000", u:"t LCE", l:"Litio proyectado", p:"2035, si avanzan 15 proyectos", s:"litLN" },
      { v:"20.141", u:"US$/t", l:"Precio del carbonato de litio", p:"promedio ene–sep 2026 (9.173 en 2025)", s:"litLN" }
    ],
    charts: [
      { t:"Exportaciones mineras por mineral", sub:"Millones de US$, enero–agosto 2026", u:"US$ M", s:"expMin",
        rows:[["Oro",3623],["Litio",1467],["Plata",726],["Cobre, plomo y otros metálicos",123],["Boratos, rocas y otros",120]] }
    ]
  },
  ag: {
    kpis: [
      { v:"64", u:"Mt", l:"Cosecha de maíz 2025/26", p:"récord, cosecha finalizada (oct-2026)", s:"maiz" },
      { v:"27,7", u:"Mt", l:"Cosecha de trigo 2025/26", p:"estimación BCR, dic-2025 · récord", s:"trigo" },
      { v:"≈ 48", u:"Mt", l:"Cosecha de soja 2025/26", p:"proyección BCR, feb-2026", s:"soja" },
      { v:"47,6", u:"Mt", l:"Molienda de oleaginosas", p:"2025 · soja 42,6 Mt · capacidad ociosa 28,2%", s:"crush" },
      { v:"≈ 13,5", u:"M cabezas", l:"Faena bovina", p:"2025 · ≈ 3,1 Mt de carne producida", s:"carne" },
      { v:"≈ 4.600", u:"US$ M", l:"Exportaciones de carne bovina", p:"2025 (proyección) · 789.000 t ene–nov", s:"carne" },
      { v:"76", u:"%", l:"Exportaciones agro por el Gran Rosario", p:"2024 · 66 Mt exportadas", s:"grosa" }
    ],
    charts: [
      { t:"Cosecha 2025/26 por cultivo", sub:"Millones de toneladas", u:"Mt", s:"maiz",
        rows:[["Maíz",64],["Soja (proyección)",48],["Trigo",27.7]], srcs:["maiz","soja","trigo"] }
    ]
  }
};
