// Arranque del sitio. Debe cargarse EL ÚLTIMO: para entonces todos los módulos
// han registrado sus onPageInit/onPageDestroy, de modo que la primera página
// se inicializa con sus animaciones completas.
onReady(startRouter);
