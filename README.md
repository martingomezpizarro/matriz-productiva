# Matriz Productiva Argentina

Mapa interactivo de los tres grandes sectores productivos de Argentina: **Oil & Gas**, **minería** y **agro/ganadería**. Muestra activos (pozos, refinerías, ductos, minas, plantas de molienda, puertos, frigoríficos), las empresas detrás de cada uno y estadísticas sectoriales. Cada dato cita su fuente.

**Sitio:** https://matriz.martingomezpizarro.com.ar

## Cómo está armado

Es un sitio estático: no hace falta compilar nada ni tener un servidor propio. Se publica con GitHub Pages desde la rama `main`.

```
index.html            estructura y estilos
js/app.js             lógica del mapa, la tabla, las empresas y los gráficos
data/
  auto/               lo regenera scripts/actualizar.py (no editar a mano)
    siacam.js           cartera oficial de proyectos mineros
    mercado.js          cotizaciones y múltiplos (Yahoo Finance)
    viz.js              series de los gráficos de Estadísticas
    produccion.js       producción de petróleo y gas por área y operadora
    fuentes-auto.js     títulos de fuentes con la fecha de descarga
    meta.js             fecha y resultado de cada paso de la actualización
  manual/             datos que se cargan a mano, cada uno con su fuente
    activos.js          plantas, puertos, ductos, áreas (PTS y LNS)
    empresas.js         directorio de empresas
    fichas.js           fichas técnicas («Cómo funciona»)
    estadisticas.js     indicadores y rankings publicados
    fuentes.js          todas las fuentes citadas (SRC)
  geo/                límites provinciales y departamentales
scripts/
  actualizar.py         baja las fuentes y regenera data/auto
  actualizar-energia.bat  corre el paso de Energía desde una PC en Argentina
```

Para verlo en local: `python -m http.server` en la carpeta del repo y abrir http://localhost:8000.

## Actualización de datos

### Automática, todos los meses (GitHub Actions)

El workflow `.github/workflows/actualizar-datos.yml` corre el **día 1 de cada mes a las 06:00** (hora de Argentina) y cierra el mes anterior. Actualiza:

| Paso | Fuente | Qué cambia en el sitio |
|---|---|---|
| `siacam` | Secretaría de Minería – cartera SIACAM (XLSX) | proyectos mineros del mapa, embudo por etapa |
| `mercado` | Yahoo Finance | precio, rango de 52 semanas, consenso y múltiplos de cada empresa |
| `precios` | Yahoo Finance (futuros BZ=F, GC=F, HG=F, ZS=F, ZC=F, ZW=F) | Brent, granos, acciones vs. commodity |
| `comercio` | INDEC – Intercambio Comercial (Series de Tiempo) | balanza comercial energética |
| `emae` | INDEC – EMAE por sector (Series de Tiempo) | actividad por sector |
| `faena` | SAGyP – faena vacuna (Series de Tiempo) | ciclo ganadero |
| `provincias` | INDEC – exportaciones por provincia y rubro | coroplético provincial |
| `agricola` | MAGyP – estimaciones agrícolas | producción por departamento y totales por campaña |

Si una fuente falla o cambia de formato, ese paso conserva el dato anterior y deja el error anotado en `data/auto/meta.js`; los demás pasos siguen. Para correrlo a mano: pestaña **Actions → Actualizar datos → Run workflow**.

### Energía, desde una PC en Argentina

El portal de la Secretaría de Energía (`datos.energia.gob.ar`) no responde a servidores fuera del país, así que la producción de petróleo y gas (Capítulo IV) se actualiza desde una computadora en Argentina:

```
scripts\actualizar-energia.bat
```

Hace `git pull`, corre `python scripts/actualizar.py --grupo energia` y sube los cambios. Requisitos en esa PC: Git con acceso al repo y Python con `pip install -r scripts/requirements.txt`.

### Datos manuales

Lo que no sale de un portal con formato estable (plantas, ductos, RIGI, fichas técnicas, cifras de informes en PDF o notas de prensa) está en `data/manual/`. Se edita a mano y cada número referencia una clave de `SRC` en `data/manual/fuentes.js`.

---

Proyecto de Martín Gómez Pizarro.
