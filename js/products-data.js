// ===== PRODUCTOS: CARRUSEL + MODAL =====
const PRODUCTS = {
  canary: {
    name: 'Canary Labs',
    cat: 'Historización de datos',
    tip: 'Historiza y analiza datos de proceso, eventos y KPIs.',
    icon: 'logos/canary.png',
    logo: 'logos/CanaryLabs_Logo.svg',
    desc: 'Plataforma de historización y análisis de datos de proceso. Almacena y visualiza años de información operativa a alta velocidad para detectar tendencias, generar reportes y mejorar el desempeño de tu planta.'
  },
  kepware: {
    name: 'Kepware',
    cat: 'Conectividad Industrial',
    tip: 'Conectividad industrial: +150 protocolos y acceso a datos de planta.',
    icon: 'logos/kepware.png',
    logo: 'logos/Wepware_Logo.png',
    desc: 'Servidor de comunicaciones industriales con soporte OPC UA/DA, Modbus y más de 150 protocolos. Conecta PLCs, controladores y dispositivos de múltiples marcas en una única capa de datos confiable.'
  },
  ignition: {
    name: 'Ignition',
    cat: 'SCADA & HMI',
    tip: 'SCADA/HMI para supervisar, controlar y visualizar procesos.',
    icon: 'logos/ignition.png',
    logo: 'logos/IgnitionLogo.png',
    desc: 'Plataforma SCADA, HMI y MES sin costo por número de tags. Ideal para supervisión, control y visualización de procesos en tiempo real desde cualquier navegador, de forma escalable y segura.'
  },
  n3uron: {
    name: 'N3uron',
    cat: 'Edge & MQTT',
    tip: 'Plataforma Edge/IIoT que recolecta y envía datos a la nube.',
    icon: 'logos/n3uron.png',
    logo: 'logos/Logotype-orange-n3uron.svg',
    desc: 'Plataforma Edge e IIoT con soporte nativo de MQTT, OPC UA y REST. Recolecta, normaliza y envía datos de campo a la nube de forma segura, impulsando arquitecturas de Industria 4.0.'
  },
  tatsoft: {
    name: 'Tatsoft (FactoryStudio)',
    cat: 'Visualización & OEE',
    tip: 'SCADA/HMI con visualización, control y monitoreo de OEE.',
    icon: 'logos/tatsoft.png',
    logo: 'logos/Tatsoft Logo.png',
    desc: 'Entorno de SCADA/HMI para visualización y control de procesos, con módulos de eficiencia (OEE) y gestión de producción que permiten monitorear el rendimiento operativo en tiempo real.'
  },
  flow: {
    name: 'Flow Software',
    cat: 'Integración de datos',
    tip: 'Integra y centraliza datos para KPIs y toma de decisiones.',
    icon: 'logos/flowsoftware.png',
    logo: 'logos/flowsoftware_Logo.png',
    desc: 'Solución de integración y movimiento de datos industriales. Conecta sistemas, bases de datos y plataformas para mantener un flujo de información continuo, confiable y en tiempo real.'
  },
  ketsol: {
    name: 'Ketsol KMS',
    cat: 'Plataforma de manufactura',
    tip: 'Conecta, historiza y analiza la planta con dashboards, alertas e IA.',
    icon: 'logos/ketsol-icon.svg',
    logo: 'logos/ketsol.svg',
    desc: 'Plataforma industrial que conecta PLCs, DCS y SCADA con más de 50 protocolos nativos, guarda el histórico de series temporales y lo convierte en dashboards, reportes, alertas por anomalías y respuestas en lenguaje natural con IA.'
  },

  // ---- Certificaciones (Nosotros): mismo aviso al pasar y mismo modal ----
  'cert-n3uron': {
    name: 'N3uron Certified Integrator',
    cat: 'Certificación',
    tip: 'Integradores certificados por N3uron para proyectos IIoT y edge.',
    icon: 'EVOLUTEK/certificado1.png',
    logo: 'EVOLUTEK/certificado1.png',
    desc: 'Acredita que nuestro equipo completó la formación y evaluación oficial de N3uron para diseñar, desplegar y dar soporte a arquitecturas IIoT con su plataforma: conectividad con PLC y equipos de campo, edge computing, MQTT y envío de datos a la nube o a historiadores. Para el cliente significa implementaciones hechas con las buenas prácticas del fabricante y con respaldo técnico reconocido.'
  },
  'cert-ignition': {
    name: 'Ignition Credentialed Integrator',
    cat: 'Certificación',
    tip: 'Integradores acreditados por Inductive Automation en Ignition.',
    icon: 'EVOLUTEK/certificado2.png',
    logo: 'EVOLUTEK/certificado2.png',
    desc: 'Reconocimiento de Inductive Automation a los integradores que cuentan con personal certificado en Ignition y experiencia demostrada en proyectos. Respalda que podemos diseñar e implementar sistemas SCADA, HMI, MES e IIoT sobre Ignition siguiendo los estándares del fabricante, con acceso a su soporte técnico.'
  },
  'cert-flow': {
    name: 'Flow Software Certified',
    cat: 'Certificación',
    tip: 'Certificados por Flow Software en integración de datos y KPIs.',
    icon: 'EVOLUTEK/certificado3.png',
    logo: 'EVOLUTEK/certificado3.png',
    desc: 'Certifica que estamos formados y evaluados por Flow Software para implementar su plataforma de integración de datos industriales: conexión de fuentes OT e IT, modelado de información, cálculo de KPIs con plantillas reutilizables y su despliegue a escala en varias plantas. Garantiza datos consistentes y confiables para la toma de decisiones.'
  }
};
