// Configuración del pie de página y de los términos de uso.
// Es el único lugar donde hay que tocar nombre, mail, links de colaboración o licencia.
// Un valor que empieza con "[COMPLETAR" se muestra resaltado en el sitio hasta que se reemplace.
window.SITIO = {
  proyecto: "Matriz Productiva Argentina",
  autor: "Martín Gómez Pizarro",
  email: "gomezpizarromartin@gmail.com",
  web: "https://martingomezpizarro.com.ar",
  repo: "https://github.com/martingomezpizarro/matriz-productiva",

  colaborar: {
    texto: "Este proyecto es gratuito e independiente. Si te resulta útil, podés colaborar voluntariamente para sostenerlo.",
    cafecito: "[COMPLETAR: link de Cafecito]",            // ej. "https://cafecito.app/usuario"
    otra: { etiqueta: "Alias para transferir", url: "martingomezpizarro" },  // un link (https://…) se muestra como botón; otro texto, como alias copiable
    aclaracion: "Las colaboraciones son voluntarias, no constituyen contraprestación por ningún servicio ni otorgan derechos sobre el contenido."
  },

  // Licencia: null = todos los derechos reservados. Para una licencia abierta, por ejemplo:
  // { contenido: "CC BY 4.0", contenidoUrl: "https://creativecommons.org/licenses/by/4.0/deed.es", codigo: "MIT", codigoUrl: "https://opensource.org/license/mit" }
  licencia: null,
  anio: 2026,

  terminos: "terminos.html",
  terminosVigencia: "2026-10-22",   // fecha de la última revisión de los términos
  jurisdiccion: "República Argentina"
};
