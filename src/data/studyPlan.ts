type ResourceBucket = {
  label: string
  path: string
  status: string
}

type StudyModule = {
  id: string
  title: string
  goal: string
  coverage: 'alta' | 'media' | 'baja'
  highlights: string[]
  gap: string
  resources: ResourceBucket[]
}

type IntakeItem = {
  title: string
  description: string
  targetFolder: string
}

export const studyModules: StudyModule[] = [
  {
    id: '01-ondas',
    title: 'Ondas',
    goal: 'Movimiento ondulatorio, magnitudes de onda y problemas base del bloque.',
    coverage: 'media',
    highlights: [
      'Problemas: ecuación de la onda',
      'Problemas: intensidad de una onda',
      'Problemas: interferencias',
      'Teoria: principio de Huygens',
      'Teoria: difracción',
      'Teoria: leyes de la reflexión y la refracción',
      'Teoria: ondas estacionarias',
      'Teoria: efecto Doppler',
      'Teoria: cualidades del sonido',
    ],
    gap: 'El tema existe, pero está troceado en imágenes y conviene unirlo en una ficha única.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/01-ondas', status: 'apuntes parciales' },
      { label: 'Formulas', path: 'content/formulas/01-ondas', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'bloque 1.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '02-sonido',
    title: 'El sonido',
    goal: 'Intensidad, nivel sonoro, cualidades del sonido y aplicaciones.',
    coverage: 'baja',
    highlights: ['Efecto Doppler', 'Apoyo en exámenes del bloque 1'],
    gap: 'Falta teoría corrida del tema; dependeremos del dossier y de exámenes para rellenarlo.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/02-sonido', status: 'solo un apunte directo' },
      { label: 'Formulas', path: 'content/formulas/02-sonido', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'bloque 1.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '03-gravitacion',
    title: 'Gravitación',
    goal: 'Campo, potencial, energía y problemas de órbitas o satélites.',
    coverage: 'media',
    highlights: ['Kepler', 'Gravitación universal', 'Problemas de bloque 1'],
    gap: 'Conviene redactar una síntesis del tema porque los apuntes directos son breves.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/03-gravitacion', status: 'apuntes cortos' },
      { label: 'Formulas', path: 'content/formulas/03-gravitacion', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'bloque 1.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '04-campo-electrico',
    title: 'Campo eléctrico',
    goal: 'Ley de Coulomb, campo, potencial, trabajo y representaciones.',
    coverage: 'media',
    highlights: ['Esquema general', 'Ley de Gauss', 'Muchos parciales específicos'],
    gap: 'Tiene soporte fuerte en exámenes, pero faltan fórmulas extraídas por tema.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/04-campo-electrico', status: 'apuntes parciales' },
      { label: 'Formulas', path: 'content/formulas/04-campo-electrico', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'parciales de electromagnetismo' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '05-campo-magnetico',
    title: 'Campo magnético',
    goal: 'Fuerza magnética, movimiento de cargas y comportamiento en campos uniformes.',
    coverage: 'media',
    highlights: ['Biot-Savart', 'Resumen de electromagnetismo', 'Bloque muy examinado'],
    gap: 'Hay buen apoyo práctico; falta convertirlo en teoría resumida navegable.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/05-campo-magnetico', status: 'apuntes parciales' },
      { label: 'Formulas', path: 'content/formulas/05-campo-magnetico', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'parciales de electromagnetismo' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '06-induccion-electromagnetica',
    title: 'Inducción electromagnética',
    goal: 'Ley de Faraday-Lenz, flujo magnético y aplicaciones clásicas.',
    coverage: 'media',
    highlights: ['Faraday', 'Lenz', 'Maxwell', 'OEM'],
    gap: 'Tema bien representado en esquemas, pero no en un resumen unificado.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/06-induccion-electromagnetica', status: 'apuntes parciales' },
      { label: 'Formulas', path: 'content/formulas/06-induccion-electromagnetica', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'bloque 2.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '08-optica-fisica',
    title: 'Óptica física',
    goal: 'Interferencias, difracción, polarización y fenómenos ondulatorios de la luz.',
    coverage: 'baja',
    highlights: ['Cobertura indirecta en ondas', 'Peso fuerte en exámenes de 2.ª evaluación'],
    gap: 'Es uno de los temas que más necesita guía o reconstrucción desde exámenes y dossier.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/08-optica-fisica', status: 'sin apuntes directos detectados' },
      { label: 'Formulas', path: 'content/formulas/08-optica-fisica', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'finales de electromagnetismo y óptica física' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '09-optica-geometrica',
    title: 'Óptica geométrica',
    goal: 'Espejos, lentes, formación de imágenes e instrumentación óptica.',
    coverage: 'media',
    highlights: ['Espejos', 'Lente convergente', 'Miopía e hipermetropía'],
    gap: 'Buen material visual; falta una teoría corrida que una conceptos y fórmulas.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/09-optica-geometrica', status: 'apuntes visuales' },
      { label: 'Formulas', path: 'content/formulas/09-optica-geometrica', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'parciales de 3.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '10-relatividad-especial',
    title: 'Relatividad especial',
    goal: 'Postulados de Einstein, dilatación temporal y contracción de longitudes.',
    coverage: 'baja',
    highlights: ['Consecuencias de la relatividad', 'Parciales de 3.ª evaluación'],
    gap: 'Tema con poca teoría directa; sería de los primeros candidatos a completar con guion.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/10-relatividad-especial', status: 'apunte muy corto' },
      { label: 'Formulas', path: 'content/formulas/10-relatividad-especial', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'parciales de 3.ª evaluación' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '11-fisica-cuantica',
    title: 'Física cuántica',
    goal: 'Dualidad onda-corpúsculo, efecto fotoeléctrico y modelos cuánticos básicos.',
    coverage: 'alta',
    highlights: ['PDF completo del tema', 'Hipótesis de Planck', 'Parciales específicos'],
    gap: 'Está bastante bien cubierto; el trabajo principal es sintetizarlo y enlazar práctica.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/11-fisica-cuantica', status: 'tema bien cubierto' },
      { label: 'Formulas', path: 'content/formulas/11-fisica-cuantica', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'parciales de física moderna' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
  {
    id: '12-fisica-nuclear',
    title: 'Física nuclear',
    goal: 'Radiactividad, defectos de masa, energía de enlace y reacciones nucleares.',
    coverage: 'alta',
    highlights: ['PDF completo del tema', 'Series radiactivas', 'Energía de enlace'],
    gap: 'Tema bien situado para convertirse pronto en seccion completa dentro de la app.',
    resources: [
      { label: 'Teoria', path: 'content/apuntes/12-fisica-nuclear', status: 'tema bien cubierto' },
      { label: 'Formulas', path: 'content/formulas/12-fisica-nuclear', status: 'formulario rápido disponible' },
      { label: 'Examenes de clase', path: 'content/examenes/Examenes de clase', status: 'finales de física moderna' },
      { label: 'EVAU', path: 'content/examenes/evau', status: '2012-2025 disponible' },
    ],
  },
]

export const coverageSummary = [
  {
    label: 'Fichas de trabajo',
    value: '11',
    note: 'Las 11 fichas de content/temas ya tienen teoría base y estructura homogénea.',
  },
  {
    label: 'Banco EVAU activo',
    value: '10 temas',
    note: 'Ya hay 20 ejercicios curados de PAU/EBAU repartidos en 10 temas.',
  },
  {
    label: 'Seguimiento de práctica',
    value: 'Listo',
    note: 'La app ya guarda si cada ejercicio queda hecho, fallado o para revisar.',
  },
  {
    label: 'Siguiente cuello de botella',
    value: 'Cobertura fina',
    note: 'Falta ampliar ejercicios en sonido y reforzar más bloques con exámenes de clase.',
  },
]

export const nextBuildSteps = [
  'La app ya puede usar las fichas reales de content/temas como contenido navegable.',
  'Ampliar el banco de ejercicios con examenes de clase y cubrir el tema de sonido.',
  'Aprovechar los formularios limpios de content/formulas para repaso rápido antes del examen.',
  'Ampliar el simulacro por bloques con más variedad de ejercicios por tema.',
]

export const appIdeas = [
  'Resumen de teoría por tema con lenguaje corto y fórmulas comentadas.',
  'Ejercicios resueltos paso a paso con errores comunes y pistas.',
  'Modo práctica con corrección final y sugerencias según fallos.',
  'Simulacros por bloques o examen completo reutilizando el estado guardado.',
  'Seguimiento del progreso con temas dominados, flojos y pendientes.',
  'Buscador por concepto, fórmula, tipo de problema o examen.',
]

export const intakeChecklist: IntakeItem[] = [
  {
    title: 'Entrada rápida sin ordenar',
    description: 'Si lo tienes todo mezclado, suéltalo primero aquí y luego lo clasificamos por tema.',
    targetFolder: 'content/00-inbox',
  },
  {
    title: 'Apuntes del curso',
    description: 'PDFs o fotos por tema para transformar teoría y ejemplos en contenido navegable.',
    targetFolder: 'content/apuntes',
  },
  {
    title: 'Ejercicios hechos en clase',
    description: 'Problemas modelo con su planteamiento y resolución para crear práctica guiada.',
    targetFolder: 'content/ejercicios',
  },
  {
    title: 'Exámenes de clase y EVAU',
    description: 'Exámenes de clase y modelos EVAU para montar el modo examen.',
    targetFolder: 'content/examenes',
  },
  {
    title: 'Formulario o resumen final',
    description: 'Constantes, definiciones y ecuaciones clave para la sección de fórmulas.',
    targetFolder: 'content/formulas',
  },
]