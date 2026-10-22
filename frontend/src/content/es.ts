// Diccionario ES (idioma por defecto). Toda cifra sale del CV de Daniel; no se inventa nada.
// `en.ts` debe tener exactamente esta forma (tipo Dict).

export type Metric = {
  label: string;
  display: string;
  before: number;
  after: number | null;
  unit: string;
  note?: string;
  kind?: "found";
};

export type Job = {
  id: string;
  period: string;
  company: string;
  role: string;
  points: string[];
  metrics: Metric[];
};

export const es = {
  meta: {
    title: "Daniel Páez · Analista de datos y desarrollador",
    description:
      "Analista de datos y desarrollador en Bogotá. Python, SQL, Power BI y automatización. Saco señal del ruido.",
  },
  nav: {
    logo: "ALEJO.DATA",
    noise: "RUIDO",
    skip: "Saltar al contenido",
    langLabel: "Idioma",
    noiseAria: "Nivel de ruido de la página",
    sections: ["Ruido", "Limpieza", "Historial", "Modelo", "Archivo", "Pipeline", "Servicios", "Señal"],
    links: { services: "Servicios", contact: "Contacto" },
  },
  hero: {
    name: "DANIEL PÁEZ",
    subtitle: "Analista de datos y desarrollador. Saco señal del ruido.",
    stack: "Python · SQL · Power BI · Automatización",
    place: "Bogotá, Colombia · disponible para trabajo remoto o híbrido",
    freelance: "También tomo proyectos freelance",
    logLabel: "Problemas reales que resolví",
    log: [
      "indicador inflado ×2.5 detectado",
      "filtro consumiendo 92% del tiempo",
      "homologación: 56%...",
      "limpiando",
    ],
  },
  limpieza: {
    title: "Ordeno el caos",
    bio: [
      "Soy analista de datos y desarrollador en Bogotá. Llevo tres años convirtiendo fuentes desordenadas (ERP, bases de terceros, hojas de cálculo) en modelos y tableros en los que una operación puede confiar.",
      "Trabajo el dato de punta a punta: lo extraigo con Python, lo modelo en SQL, lo muestro en Power BI y lo dejo corriendo solo. También diseño y construyo la interfaz; este sitio, con su propio backend, es parte de la prueba.",
    ],
    skillsLabel: "Herramientas por grupo",
    groups: [
      { name: "Python", tools: ["Pandas", "NumPy", "Selenium", "regex"] },
      {
        name: "SQL",
        tools: ["SQL / T-SQL", "SQL Server", "Azure SQL", "MySQL", "CTEs", "Stored procedures"],
      },
      {
        name: "Power BI",
        tools: ["DAX", "Power Query", "Modelo estrella", "RLS", "Looker Studio", "Tableau"],
      },
      { name: "PostgreSQL", tools: ["Cloud SQL"] },
      {
        name: "Cloud",
        tools: [
          "GCP",
          "Azure Data Factory",
          "AWS S3 / Athena",
          "Linux / systemd",
          "dbt y Databricks (exposición)",
        ],
      },
      {
        name: "Automatización",
        tools: ["n8n", "Power Automate", "Power Apps", "systemd"],
      },
      { name: "IA", tools: ["Azure OpenAI", "LangChain", "Prompt Flow"] },
      { name: "React", tools: ["JavaScript", "APIs REST", "Git"] },
    ],
  },
  historial: {
    title: "Antes → después",
    intro: "Cada empleo es un lote de limpieza: el dato entra sucio y sale con una métrica.",
    before: "antes",
    after: "después",
    found: "hallazgo",
    jobs: <Job[]>[
      {
        id: "mueblimaquinas",
        period: "10/2023 – 10/2024",
        company: "Mueblimaquinas",
        role: "Web Master y Analista de Datos",
        points: [
          "Reportes automatizados con Python.",
          "Power BI sobre ERP y CRM.",
          "Google Analytics y el sitio web corporativo.",
        ],
        metrics: [
          { label: "Tiempo manual de reportes", display: "−60%", before: 100, after: 40, unit: "índice" },
        ],
      },
      {
        id: "slb",
        period: "11/2024 – 04/2025",
        company: "SLB Pes Colombia",
        role: "Analista de Datos y Desarrollador",
        points: [
          "Modelado y optimización en SQL Server.",
          "ETL con calidad de datos.",
          "KPIs con alertas de umbral.",
        ],
        metrics: [],
      },
      {
        id: "supernumerarios",
        period: "05/2025 – 05/2026",
        company: "Supernumerarios SAS",
        role: "Analista de Datos y BI",
        points: [
          "Azure Data Factory, Power Apps y Power Automate.",
          "Power BI con modelo estrella, DAX y RLS.",
          "Reportes críticos más rápidos con CTEs, stored procedures e índices.",
          "AWS S3 / Athena unificado con Azure.",
          "Chatbot con Azure OpenAI + LangChain + Prompt Flow sobre datos reales.",
        ],
        metrics: [
          { label: "Tiempo de reportes críticos", display: "−40%", before: 100, after: 60, unit: "índice" },
        ],
      },
      {
        id: "vise",
        period: "07/2026 – hoy",
        company: "VISE",
        role: "Analista de Información",
        points: [
          "ETL en Python que consolida Odoo (XML-RPC), MySQL de terceros (túnel SSH) y Google Sheets en PostgreSQL sobre Cloud SQL.",
          "Power BI para 6 frentes de operación.",
          "Automatización con systemd y alertas por correo.",
        ],
        metrics: [
          {
            label: "Indicador de cumplimiento",
            display: "×2.5 → ×1",
            before: 250,
            after: 100,
            unit: "índice",
            note: "Llave real del hecho, índice único y advisory lock.",
          },
          {
            label: "Homologación automática",
            display: "56% → 73%",
            before: 56,
            after: 73,
            unit: "%",
          },
          {
            label: "Un filtro consumía el tiempo de cada vista de un tablero",
            display: "92%",
            before: 92,
            after: null,
            unit: "%",
            kind: "found",
          },
        ],
      },
    ],
    ledgerTitle: "Formación",
    ledger: [
      { k: "Universidad Central", v: "Ingeniería en Sistemas · en curso, últimos semestres" },
      { k: "SENA", v: "Tecnólogo ADSI · 2023" },
      { k: "Google", v: "Data Analytics · 2025" },
      { k: "En preparación", v: "PL-300 y AWS CLF-C02 · 2026" },
      { k: "Idiomas", v: "Español nativo · inglés B1" },
    ],
  },
  modelo: {
    title: "Modelo",
    intro: "Cinco proyectos, cada uno como un dataset.",
    synthetic: "sintético",
    syntheticNote: "Datos sintéticos que representan el problema. No son datos de ninguna empresa.",
    cards: {
      indicador: {
        file: "indicador_cumplimiento.csv",
        shape: "8 × 3",
        title: "El indicador que mentía",
        text: "Corregí un indicador de cumplimiento que salía inflado 2,5 veces: llave real del hecho, índice único y advisory lock.",
        reported: "reportado",
        real: "real",
        axis: "periodo",
      },
      pipeline: {
        file: "pipeline_multifuente.dag",
        shape: "3 fuentes → 1 base",
        title: "Tres fuentes, una base",
        text: "Un ETL en Python consolida un ERP, una base de terceros y hojas de cálculo en PostgreSQL, y de ahí alimenta Power BI.",
        sources: ["Odoo · XML-RPC", "MySQL de terceros · túnel SSH", "Google Sheets"],
        etl: "ETL · Python",
        db: "PostgreSQL · Cloud SQL",
        bi: "Power BI",
      },
      chatbot: {
        file: "chatbot.flow",
        shape: "5 nodos",
        title: "Chatbot sobre datos reales",
        text: "Un chatbot que responde preguntas sobre datos reales con Azure OpenAI, LangChain y Prompt Flow.",
        nodes: ["Pregunta", "LangChain + Prompt Flow", "Datos reales", "Azure OpenAI", "Respuesta"],
      },
      facturas: {
        file: "facturas.pdf → facturas.xlsx",
        shape: "PDF → tabla",
        title: "Extractor de facturas PDF",
        text: "Python, regex y pdfplumber leen facturas en PDF y openpyxl las deja en una tabla de Excel.",
        pdfLabel: "PDF",
        xlsxLabel: "XLSX",
        cols: ["factura", "fecha", "total"],
      },
      ecommerce: {
        file: "ecommerce.pbix",
        shape: "13 KPIs",
        title: "Dashboard E-commerce, de punta a punta",
        text: "SQL Server y Azure SQL, un modelo estrella y 13 KPIs con drill-through en Power BI.",
        chain: ["SQL Server", "Azure SQL", "Modelo estrella", "Power BI"],
        kpis: "13 KPIs · drill-through",
      },
    },
    freelance: {
      file: "marketeros.freelance",
      title: "Freelance Marketeros",
      text: "React, Google Analytics y SQL para medir el ROI, con Looker Studio.",
    },

  },
  archivo: {
    title: "Archivo vivo",
    text: "Esta sección se actualiza sola desde github.com/nieldro. El backend lee los repositorios con el topic portfolio, así que decido qué aparece agregando o quitando ese topic, sin tocar el sitio.",
    heatmapLabel: "Contribuciones del último año",
    filters: "Filtrar por tecnología",
    all: "Todo",
    emptyTitle: "Sin sincronizar",
    empty: "Esta sección se conecta con GitHub cuando el backend está en línea. Mientras tanto, el código está en github.com/nieldro.",
    stars: "estrellas",
    lastCommit: "último commit",
    repo: "repo",
    demo: "demo",
    synced: "Sincronizado",
    staleNote: "GitHub no respondió: se muestra la última copia guardada.",
    contributionsTotal: "contribuciones en el último año",
    emptyConnected: "Todavía no hay repositorios con el topic portfolio en github.com/nieldro. Agrega el topic a un repo y aparece aquí solo.",
    loading: "Sincronizando con GitHub...",
    emptyConnectedTitle: "Aún sin repos con el topic",
    unavailable: "GitHub no está disponible ahora mismo.",
    less: "menos",
    more: "más",
    contribOn: "contribuciones el",
    noDesc: "Sin descripción.",
    filterLabel: "Filtrar por tecnología",
  },
  pipeline: {
    title: "Tú eres el dataset",
    text: "Este sitio es un pipeline real: tu visita viaja del navegador a una API en FastAPI, se guarda en PostgreSQL y aparece abajo.",
    nodes: ["Navegador", "FastAPI", "PostgreSQL", "Panel"],
    panelTitle: "Panel en vivo",
    visits: "Visitas de hoy",
    countries: "Países",
    depth: "Profundidad de scroll por sección",
    noData: "sin datos",
    offline: "Backend sin conexión. Cuando conecte, estas cifras serán reales.",
    logTitle: "Log en vivo",
    logEmpty: "Esperando eventos...",
    privacy:
      "No guardo tu IP en claro ni uso cookies de terceros. Guardo un identificador de sesión anónimo, tu país, el tipo de dispositivo y hasta dónde llegaste.",
    chatTitle: "Pregúntale a mi CV",
    chatText: "Un mini chat limitado a responder sobre mi experiencia. Refleja el chatbot que ya construí.",
    chatPlaceholder: "Ej.: ¿Qué hiciste en VISE?",
    chatSend: "Preguntar",
    chatSoon: "El chat se activa cuando el backend esté en línea.",
    chatLabel: "Pregunta sobre mi experiencia",
    chatThinking: "Pensando...",
    chatLimit: "Llegaste al límite de preguntas por hora. Vuelve más tarde.",
    chatError: "No pude responder ahora. Intenta de nuevo.",
    chatYou: "Tú",
    chatCv: "CV",
    statusLive: "en vivo",
    statusConnecting: "conectando...",
    statusOffline: "sin conexión",
    zeroVisits: "Aún no hay visitas hoy. La próxima eres tú.",
    logVisit: "visita",
    logScroll: "scroll",
    sectionDepth: "promedio",
    topCountries: "Principales",
    noGeo: "sin geolocalización",
  },
  servicios: {
    title: "Contrátame para limpiar tu caos",
    query: "SELECT * FROM servicios ORDER BY necesidad;",
    listLabel: "Servicios, agrupados por lo que necesitas",
    currencyLabel: "Ver precios en",
    refPrice:
      "Precios de referencia en pesos colombianos (COP). El precio final depende de lo que necesites y te lo confirmo antes de empezar.",
    usdNote: "USD calculado a {rate} COP por dólar (tasa de referencia, no la del día).",
    cols: { from: "desde", delivery: "entrega" },
    quote: "se cotiza según lo que necesites",
    includes: "Incluye",
    excludes: "Aparte del precio",
    details: "Qué incluye",
    example: "Trabajo relacionado",
    recurring: "Además hay un pago recurrente que acordamos antes de empezar.",
    cta: "Cotizar esto",
    unsure: "¿No sabes cuál es el tuyo? Cuéntame tu problema y te digo cuál te sirve.",
    unsureOption: "No sé, ayúdame a elegir",
    quoting: "Estás cotizando:",
    change: "Cambiar",
    formTitle: "Pide tu cotización",
    formIntro: "Cuéntame con tus palabras qué necesitas y te respondo con precio y plazo.",
    n8nNote: "Este formulario es un flujo de n8n: una demo viva del servicio de automatización.",
    fService: "Servicio",
    fMessage: "Cuéntame qué necesitas, con tus palabras",
    fContact: "¿Cómo te escribo?",
    fContactHint: "Tu correo o tu número de WhatsApp",
    fBudget: "¿Tienes un presupuesto en mente? (opcional)",
    budgetPh: "Ej.: hasta $2.000.000",
    fDeadline: "¿Para cuándo lo necesitas? (opcional)",
    deadlinePh: "Ej.: dentro de un mes",
    send: "Enviar cotización",
    sending: "Enviando...",
    ok: "Recibido. Te escribo pronto.",
    okMail: "Se abrió tu correo con el mensaje listo para enviar.",
    error: "No se envió. Escríbeme directo y te respondo:",
    required: "Falta este dato",
    choose: "Elige un servicio",
  },
  senal: {
    title: "Hablemos.",
    place: "Bogotá · remoto o híbrido",
    email: "dapt.torres@gmail.com",
    linkedin: "linkedin.com/in/daniel-paez-torres",
    github: "github.com/nieldro",
    cv: "Descargar CV en PDF",
    cvNote: "PDF · 2 páginas · español",
    cvFile: "cv/CV_Daniel_Paez_Analista_Datos.pdf",
    copy: "Copiar",
    copied: "Copiado",
    copyAria: "Copiar el correo al portapapeles",
    end: "Señal limpia. Gracias por leer.",
  },
};

export type Dict = typeof es;
