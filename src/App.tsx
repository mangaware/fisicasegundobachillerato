import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react'
import MathFormula from './components/MathFormula'
import MockExamView, { type MockExamBlock } from './components/MockExamView'
import { exerciseSheetById, type ExerciseEntry } from './data/exerciseSheets'
import { formulaSheets } from './data/formulaSheets'
import {
  coverageSummary,
  studyModules,
} from './data/studyPlan'
import { formulaSheetById } from './data/formulaSheets'
import { topicSheets, topicSheetById } from './data/topicSheets'
import ondasPauPdf from '../content/apuntes/01-ondas/apuntes ondas/enunciado-3.pdf?url'
import gravitacionPauPdf from '../content/apuntes/03-gravitacion/enunciado-6.pdf?url'
import campoElectricoPauPdf from '../content/apuntes/04-campo-electrico/enunciado-2.pdf?url'
import campoMagneticoPauPdf from '../content/apuntes/05-campo-magnetico/enunciado-4.pdf?url'
import opticaPauPdf from '../content/apuntes/08-optica-fisica/enunciado.pdf?url'
import fisicaSigloXxPauPdf from '../content/apuntes/11-fisica-cuantica/enunciado-5.pdf?url'

const coverageTone: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'coverage-high',
  media: 'coverage-medium',
  baja: 'coverage-low',
}

type ContentFilter = 'todo' | 'teoria' | 'formulas' | 'ebau' | 'problemas'
type PracticeStatus = 'pendiente' | 'hecho' | 'fallado' | 'revisar'
type PracticeMode = 'todos' | 'fallados'
type PracticeErrorTag = 'formula' | 'despeje' | 'unidades' | 'signo' | 'calculo' | 'arranque' | 'enunciado'
type MainView = 'inicio' | 'estudio' | 'practica' | 'simulacros' | 'simulaciones' | 'ampliacion' | 'resumen'
type SimulationId = 'ondas' | 'optica' | 'espejos'
type VisualTheme = 'dark' | 'light'
type SearchResultKind = 'concepto' | 'formula' | 'simulacion'
type SpiderMenuState = 'idle' | 'climbing-up' | 'hidden' | 'climbing-down'

type SearchResult = {
  id: string
  topicId: string
  kind: SearchResultKind
  title: string
  subtitle: string
  snippet: string
  targetView?: MainView
  simulationId?: SimulationId
}

type StudyAccordionPanel = 'teoria' | 'formulas' | 'ebau' | 'problemas' | 'quick-formulas'
type PracticeExercise = ExerciseEntry & {
  topicId: string
  topicTitle: string
}

const mainViewLabels: Record<MainView, string> = {
  inicio: 'Inicio',
  estudio: 'Estudio',
  practica: 'Práctica',
  simulacros: 'Simulacros',
  simulaciones: 'Simulaciones',
  ampliacion: 'PhET',
  resumen: 'Resumen',
}

const mainViewOrder: MainView[] = ['inicio', 'estudio', 'practica', 'simulacros', 'simulaciones', 'ampliacion', 'resumen']

const homePhysicists = [
  {
    name: 'Albert Einstein',
    role: 'Relatividad',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg',
  },
  {
    name: 'Marie Curie',
    role: 'Radiactividad',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/250px-Marie_Curie_c._1920s.jpg',
  },
  {
    name: 'Richard Feynman',
    role: 'QED',
    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Richard_Feynman_Nobel.jpg/250px-Richard_Feynman_Nobel.jpg',
  },
] as const

const homeStudySuggestions = [
  'Empieza por Estudio para repasar teoría y fórmulas del tema que estés trabajando.',
  'Pasa a Práctica y marca cada ejercicio como hecho, fallado o revisar.',
  'Usa Simulaciones y PhET cuando necesites ver el fenómeno antes de resolver problemas.',
] as const

const simulationCards: Array<{
  id: SimulationId
  kicker: string
  title: string
  status: string
  symbol: string
  topicId: string
  law: string
  summary: string
  controls: string[]
  takeaways: string[]
}> = [
  {
    id: 'ondas',
    kicker: 'Simulación activa',
    title: 'Ondas armónicas',
    status: 'Lista para manipular',
    symbol: 'λ',
    topicId: '01-ondas',
    law: 'v = λf',
    summary:
      'Manipula amplitud, frecuencia, velocidad y fase para ver cómo cambian la longitud de onda, el período y la ecuación de onda.',
    controls: ['Amplitud A', 'Frecuencia f', 'Velocidad v', 'Fase inicial φ', 'Tiempo t'],
    takeaways: [
      'Distinguir qué parámetro cambia la forma y cuál cambia el ritmo.',
      'Ver cómo λ depende de v y f en tiempo real.',
      'Conectar la representación gráfica con la ecuación senoidal.',
    ],
  },
  {
    id: 'optica',
    kicker: 'Nueva simulación',
    title: 'Lentes e imágenes',
    status: 'Lista para manipular',
    symbol: 'f',
    topicId: '09-optica-geometrica',
    law: '1/s − 1/s′ = 1/f′',
    summary:
      'Mover el objeto delante de una lente para ver la formación de la imagen, el aumento y el tipo de imagen sin memorizar casos aislados.',
    controls: ['Distancia focal', 'Posición del objeto', 'Altura del objeto', 'Tipo de lente'],
    takeaways: [
      'Entender cuándo la imagen es real o virtual.',
      'Leer el efecto del cambio de foco sobre los rayos principales.',
      'Pasar de la construcción geométrica a la ecuación de lentes.',
    ],
  },
  {
    id: 'espejos',
    kicker: 'Tercera simulación',
    title: 'Espejos esféricos',
    status: 'Lista para manipular',
    symbol: 'R',
    topicId: '09-optica-geometrica',
    law: '1/s + 1/s′ = 1/f',
    summary:
      'Mover el objeto frente a un espejo cóncavo o convexo para leer posición, tamaño y orientación de la imagen con el mismo lenguaje de examen.',
    controls: ['Tipo de espejo', 'Distancia focal', 'Posición del objeto', 'Altura del objeto'],
    takeaways: [
      'Distinguir cuándo la imagen es real o virtual en espejos.',
      'Relacionar F, C y V con la construcción de rayos.',
      'Pasar del esquema geométrico a la ecuación de espejos sin memorizar casos sueltos.',
    ],
  },
]

const phetResources = [
  {
    group: 'Ondas',
    title: 'Ondas: Intro',
    topicLabel: 'Ondas y sonido',
    topicId: '01-ondas',
    url: 'https://phet.colorado.edu/es/simulations/waves-intro',
    focus: 'Refuerza amplitud, frecuencia, periodo y propagación con una visualización muy limpia.',
    notes: [
      'Útil para distinguir qué cambia la forma de la onda y qué cambia su ritmo.',
      'Encaja bien después de manipular la simulación propia de ondas de la app.',
    ],
    nativeSimulationId: 'ondas',
  },
  {
    group: 'Ondas',
    title: 'Onda en una cuerda',
    topicLabel: 'Ondas y sonido',
    topicId: '01-ondas',
    url: 'https://phet.colorado.edu/es/simulations/wave-on-a-string',
    focus: 'Permite ver mejor reflexión, pulsos, extremos fijos y ondas estacionarias en una cuerda.',
    notes: [
      'Muy útil para separar pulsos de ondas armónicas.',
      'Aporta casos visuales que luego conectan bien con sonido y superposición.',
    ],
    nativeSimulationId: 'ondas',
  },
  {
    group: 'Ondas',
    title: 'Ondas Sonoras',
    topicLabel: 'Sonido',
    topicId: '02-sonido',
    url: 'https://phet.colorado.edu/es/simulations/sound-waves',
    focus: 'Permite visualizar compresiones, rarefacciones y propagación del sonido como onda longitudinal.',
    notes: [
      'Ayuda a distinguir sonido de onda transversal dibujada en una gráfica.',
      'Sirve para repasar frecuencia, longitud de onda y medio material antes de problemas de sonido.',
    ],
  },
  {
    group: 'Ondas',
    title: 'Masas y Resortes',
    topicLabel: 'Movimiento periódico',
    topicId: '01-ondas',
    url: 'https://phet.colorado.edu/es/simulations/masses-and-springs',
    focus: 'Conecta oscilación, período, energía y movimiento armónico antes de estudiar ondas.',
    notes: [
      'Útil para ver de dónde sale la idea de oscilación periódica.',
      'Refuerza amplitud, periodo y energía en un sistema más tangible.',
    ],
  },
  {
    group: 'Ondas',
    title: 'Interferencia de Ondas',
    topicLabel: 'Óptica física y ondas',
    topicId: '08-optica-fisica',
    url: 'https://phet.colorado.edu/es/simulations/wave-interference',
    focus: 'Amplía interferencia, doble foco emisor y patrones de máximos y mínimos.',
    notes: [
      'Sirve para pasar de la intuición visual al patrón de interferencia.',
      'Encaja especialmente bien cuando se estudia óptica física.',
    ],
  },
  {
    group: 'Gravitación',
    title: 'Gravedad y Órbitas',
    topicLabel: 'Gravitación',
    topicId: '03-gravitacion',
    url: 'https://phet.colorado.edu/es/simulations/gravity-and-orbits',
    focus: 'Visualiza fuerza gravitatoria, órbitas y movimiento circular con Tierra, Luna y satélites.',
    notes: [
      'Sirve para conectar fuerza centrípeta y gravitación universal.',
      'Muy útil antes de problemas de satélites, períodos orbitales y dependencia con la masa.',
    ],
  },
  {
    group: 'Gravitación',
    title: 'Mi Sistema Solar',
    topicLabel: 'Gravitación',
    topicId: '03-gravitacion',
    url: 'https://phet.colorado.edu/es/simulations/my-solar-system',
    focus: 'Permite experimentar con sistemas orbitales y ver estabilidad, colisiones y trayectorias.',
    notes: [
      'Aporta intuición sobre órbitas elípticas y condiciones iniciales.',
      'Encaja bien después de repasar leyes de Kepler y conservación de energía.',
    ],
  },
  {
    group: 'Óptica',
    title: 'Óptica Geométrica',
    topicLabel: 'Lentes',
    topicId: '09-optica-geometrica',
    url: 'https://phet.colorado.edu/es/simulations/geometric-optics',
    focus: 'Amplía la simulación de lentes con más configuraciones y trazado de rayos.',
    notes: [
      'Sirve para consolidar imagen real o virtual sin salir del lenguaje geométrico.',
      'Conviene usarla cuando ya se domina la ecuación de lentes delgadas.',
    ],
    nativeSimulationId: 'optica',
  },
  {
    group: 'Óptica',
    title: 'Óptica Geométrica: Intro',
    topicLabel: 'Lentes y espejos',
    topicId: '09-optica-geometrica',
    url: 'https://phet.colorado.edu/es/simulations/geometric-optics-basics',
    focus: 'Da una versión más guiada para empezar con foco, rayos principales e imagen.',
    notes: [
      'Buena opción si se quiere una entrada más suave antes de la simulación completa.',
      'Complementa bien las simulaciones nativas de lentes y espejos de la app.',
    ],
    nativeSimulationId: 'optica',
  },
  {
    group: 'Óptica',
    title: 'Reflexión y Refracción de la Luz',
    topicLabel: 'Óptica geométrica',
    topicId: '09-optica-geometrica',
    url: 'https://phet.colorado.edu/es/simulations/bending-light',
    focus: 'Introduce cambio de medio, ángulo límite y refracción con una experiencia más visual.',
    notes: [
      'Aporta ampliación más allá de lentes y espejos.',
      'Es buena para enlazar con ejercicios de índice de refracción y reflexión total.',
    ],
  },
  {
    group: 'Física moderna',
    title: 'Efecto Fotoeléctrico',
    topicLabel: 'Física cuántica',
    topicId: '11-fisica-cuantica',
    url: 'https://phet.colorado.edu/es/simulation/photoelectric',
    focus: 'Permite manipular frecuencia, intensidad y material para ver emisión de electrones.',
    notes: [
      'Es ideal para separar energía del fotón e intensidad de la luz.',
      'Conecta directamente con frecuencia umbral, trabajo de extracción y potencial de frenado.',
    ],
  },
  {
    group: 'Física moderna',
    title: 'Modelos del Átomo de Hidrógeno',
    topicLabel: 'Física cuántica',
    topicId: '11-fisica-cuantica',
    url: 'https://phet.colorado.edu/es/simulations/hydrogen-atom',
    focus: 'Compara modelos atómicos y ayuda a entender niveles de energía y espectros.',
    notes: [
      'Buena para ver por qué el modelo clásico no basta.',
      'Acompaña bien la parte de Bohr, cuantización y emisión/absorción.',
    ],
  },
  {
    group: 'Física moderna',
    title: 'Dispersión de Rutherford',
    topicLabel: 'Física nuclear',
    topicId: '12-fisica-nuclear',
    url: 'https://phet.colorado.edu/es/simulation/rutherford-scattering',
    focus: 'Muestra cómo la dispersión de partículas alfa revela la estructura del núcleo.',
    notes: [
      'Ayuda a entender la evidencia experimental del núcleo atómico.',
      'Sirve como puente entre estructura atómica y física nuclear.',
    ],
  },
  {
    group: 'Física moderna',
    title: 'Isótopos y Masa Atómica',
    topicLabel: 'Física nuclear',
    topicId: '12-fisica-nuclear',
    url: 'https://phet.colorado.edu/es/simulation/isotopes-and-atomic-mass',
    focus: 'Permite construir isótopos y relacionar protones, neutrones, estabilidad y masa atómica.',
    notes: [
      'Útil para fijar número atómico, número másico e isótopos.',
      'Complementa la parte de núcleos antes de entrar en radiactividad y energía de enlace.',
    ],
  },
  {
    group: 'Electricidad',
    title: 'Ley de Coulomb',
    topicLabel: 'Campo eléctrico',
    topicId: '04-campo-electrico',
    url: 'https://phet.colorado.edu/es/simulations/coulombs-law',
    focus: 'Centra la atención en la dependencia con la distancia y el signo de las cargas.',
    notes: [
      'Es más directa que un mapa completo de campo cuando se quiere practicar la ley de Coulomb.',
      'Permite leer con rapidez cómo cambian módulo y sentido de la fuerza.',
    ],
  },
  {
    group: 'Electricidad',
    title: 'Cargas y campos',
    topicLabel: 'Campo eléctrico',
    topicId: '04-campo-electrico',
    url: 'https://phet.colorado.edu/es/simulations/charges-and-fields',
    focus: 'Permite estudiar líneas de campo, potencial y superposición con más profundidad.',
    notes: [
      'Es mejor como ampliación que como simulación central dentro de esta app.',
      'Ayuda a visualizar por qué una línea de campo nunca se cruza con otra.',
    ],
  },
  {
    group: 'Magnetismo',
    title: 'Imán y brújula',
    topicLabel: 'Campo magnético',
    topicId: '05-campo-magnetico',
    url: 'https://phet.colorado.edu/es/simulations/magnet-and-compass',
    focus: 'Introduce la orientación del campo magnético y su efecto sobre una brújula de forma muy clara.',
    notes: [
      'Útil para fijar el sentido del campo antes de pasar a reglas y fuerzas magnéticas.',
      'Es una ampliación simple y muy visual para magnetismo básico.',
    ],
  },
  {
    group: 'Magnetismo',
    title: 'Imanes y Electroimanes',
    topicLabel: 'Campo magnético',
    topicId: '05-campo-magnetico',
    url: 'https://phet.colorado.edu/es/simulations/magnets-and-electromagnets',
    focus: 'Relaciona imanes, bobinas y electroimanes con una visualización más rica que la app principal.',
    notes: [
      'Muy útil para enlazar magnetismo con corriente y bobinas.',
      'Sirve como puente natural antes de entrar en inducción electromagnética.',
    ],
  },
  {
    group: 'Inducción',
    title: 'Ley de Faraday',
    topicLabel: 'Inducción electromagnética',
    topicId: '06-induccion-electromagnetica',
    url: 'https://phet.colorado.edu/es/simulations/faradays-law',
    focus: 'Sustituye la simulación retirada con un recurso externo más robusto para flujo y fem inducida.',
    notes: [
      'Queda como recurso de ampliación, no como pieza nativa de la app.',
      'Úsala cuando interese profundizar en bobinas, imanes y variación de flujo sin complicar la interfaz principal.',
    ],
  },
  {
    group: 'Inducción',
    title: 'Laboratorio Electromagnético de Faraday',
    topicLabel: 'Inducción electromagnética',
    topicId: '06-induccion-electromagnetica',
    url: 'https://phet.colorado.edu/es/simulations/faradays-electromagnetic-lab',
    focus: 'Ofrece un laboratorio más completo con bobinas, transformadores y generadores.',
    notes: [
      'Es la opción más potente para profundizar en inducción fuera de la interfaz principal de la app.',
      'Conviene usarla como exploración avanzada después de la teoría del tema.',
    ],
  },
  {
    group: 'Inducción',
    title: 'Generador',
    topicLabel: 'Inducción electromagnética',
    topicId: '06-induccion-electromagnetica',
    url: 'https://phet.colorado.edu/es/simulations/generator',
    focus: 'Conecta la inducción con la producción de corriente alterna y el giro mecánico.',
    notes: [
      'Va muy bien para entender aplicaciones físicas de la ley de Faraday.',
      'Complementa mejor la parte tecnológica del bloque que una bobina aislada.',
    ],
  },
] as const

const phetGroupMeta: Record<
  (typeof phetResources)[number]['group'],
  { icon: string; accentClassName: string; description: string }
> = {
  Ondas: {
    icon: 'λ',
    accentClassName: 'phet-group-ondas',
    description: 'Propagación, pulsos, interferencia y lectura visual de fenómenos ondulatorios.',
  },
  Gravitación: {
    icon: 'G',
    accentClassName: 'phet-group-gravitacion',
    description: 'Órbitas, fuerza gravitatoria, satélites y sistemas planetarios.',
  },
  'Óptica': {
    icon: '◐',
    accentClassName: 'phet-group-optica',
    description: 'Lentes, espejos, refracción y trazado geométrico de rayos.',
  },
  'Física moderna': {
    icon: 'h',
    accentClassName: 'phet-group-moderna',
    description: 'Cuántica, efecto fotoeléctrico, modelos atómicos e introducción nuclear.',
  },
  Electricidad: {
    icon: 'q',
    accentClassName: 'phet-group-electricidad',
    description: 'Fuerza eléctrica, líneas de campo y superposición entre cargas.',
  },
  Magnetismo: {
    icon: 'B',
    accentClassName: 'phet-group-magnetismo',
    description: 'Campo magnético, brújulas, imanes y electroimanes.',
  },
  Inducción: {
    icon: 'ε',
    accentClassName: 'phet-group-induccion',
    description: 'Flujo magnético, fem inducida, generadores y laboratorio de Faraday.',
  },
}

type PhetGroup = keyof typeof phetGroupMeta

const filterLabels: Record<ContentFilter, string> = {
  todo: 'Vista completa',
  teoria: 'Solo teoría',
  formulas: 'Solo fórmulas',
  ebau: 'Solo PAU',
  problemas: 'Solo problemas',
}

function getSectionTitleLabel(title: string, kind: Exclude<ContentFilter, 'todo'> | 'apoyo') {
  if (kind === 'ebau') {
    return 'Cuestiones PAU'
  }

  return title
}

const practiceStatusLabels: Record<PracticeStatus, string> = {
  pendiente: 'Pendiente',
  hecho: 'Hecho',
  fallado: 'Fallado',
  revisar: 'Revisar',
}

const practiceModeLabels: Record<PracticeMode, string> = {
  todos: 'Todos',
  fallados: 'Fallados y revisar',
}

const practiceErrorTagLabels: Record<PracticeErrorTag, string> = {
  formula: 'Fórmula',
  despeje: 'Despeje',
  unidades: 'Unidades',
  signo: 'Signo/sentido',
  calculo: 'Cálculo',
  arranque: 'No sabía empezar',
  enunciado: 'Enunciado',
}

const practicePatternFallback = 'General'
const practiceTopicIdsByModuleId: Partial<Record<string, string[]>> = {
  '01-ondas': ['01-ondas', '08-optica-fisica', '09-optica-geometrica'],
  '10-relatividad-especial': ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'],
  '11-fisica-cuantica': ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'],
  '12-fisica-nuclear': ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'],
}

function getPracticeTopicIds(selectedTopicId: string) {
  const relatedTopicIds = practiceTopicIdsByModuleId[selectedTopicId] ?? [selectedTopicId]

  return [selectedTopicId, ...relatedTopicIds.filter((topicId) => topicId !== selectedTopicId)]
}

const practicePdfBanks = [
  {
    id: 'ondas',
    title: 'Enunciados PAU · Ondas',
    topicIds: ['01-ondas'],
    path: 'content/apuntes/01-ondas/apuntes ondas/enunciado-3.pdf',
    url: ondasPauPdf,
    note: 'Banco de ejercicios de ondas por años.',
  },
  {
    id: 'gravitacion',
    title: 'Enunciados PAU · Gravitación',
    topicIds: ['03-gravitacion'],
    path: 'content/apuntes/03-gravitacion/enunciado-6.pdf',
    url: gravitacionPauPdf,
    note: 'Ejercicios de gravitación por años.',
  },
  {
    id: 'campo-electrico',
    title: 'Enunciados PAU · Campo eléctrico',
    topicIds: ['04-campo-electrico'],
    path: 'content/apuntes/04-campo-electrico/enunciado-2.pdf',
    url: campoElectricoPauPdf,
    note: 'Ejercicios de campo eléctrico por años.',
  },
  {
    id: 'campo-magnetico',
    title: 'Enunciados PAU · Campo magnético',
    topicIds: ['05-campo-magnetico'],
    path: 'content/apuntes/05-campo-magnetico/enunciado-4.pdf',
    url: campoMagneticoPauPdf,
    note: 'Ejercicios de campo magnético por años.',
  },
  {
    id: 'optica',
    title: 'Enunciados PAU · Óptica física y geométrica',
    topicIds: ['08-optica-fisica', '09-optica-geometrica'],
    path: 'content/apuntes/08-optica-fisica/enunciado.pdf',
    url: opticaPauPdf,
    note: 'Un mismo PDF contiene ejercicios de óptica física y óptica geométrica.',
  },
  {
    id: 'fisica-siglo-xx',
    title: 'Enunciados PAU · Física del siglo XX',
    topicIds: ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'],
    path: 'content/apuntes/11-fisica-cuantica/enunciado-5.pdf',
    url: fisicaSigloXxPauPdf,
    note: 'Un mismo PDF contiene relatividad, física cuántica y física nuclear.',
  },
]

const mockExamBlocks: MockExamBlock[] = [
  {
    id: 'simulacro-1',
    title: 'Simulacro 1',
    description: 'Bloque obligatorio: Gravitación. Los otros tres bloques van con opción A/B.',
    obligatorySectionId: 'gravitacion',
    sections: [
      { id: 'gravitacion', title: 'Gravitación', topicIds: ['03-gravitacion'] },
      { id: 'electromagnetismo', title: 'Electromagnetismo', topicIds: ['04-campo-electrico', '05-campo-magnetico', '06-induccion-electromagnetica'] },
      { id: 'ondas-vibraciones', title: 'Ondas y vibraciones', topicIds: ['01-ondas', '02-sonido', '08-optica-fisica', '09-optica-geometrica'] },
      { id: 'fisica-siglo-xx', title: 'Física del siglo XX', topicIds: ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'] },
    ],
  },
  {
    id: 'simulacro-2',
    title: 'Simulacro 2',
    description: 'Bloque obligatorio: Electromagnetismo. Los otros tres bloques van con opción A/B.',
    obligatorySectionId: 'electromagnetismo',
    sections: [
      { id: 'gravitacion', title: 'Gravitación', topicIds: ['03-gravitacion'] },
      { id: 'electromagnetismo', title: 'Electromagnetismo', topicIds: ['04-campo-electrico', '05-campo-magnetico', '06-induccion-electromagnetica'] },
      { id: 'ondas-vibraciones', title: 'Ondas y vibraciones', topicIds: ['01-ondas', '02-sonido', '08-optica-fisica', '09-optica-geometrica'] },
      { id: 'fisica-siglo-xx', title: 'Física del siglo XX', topicIds: ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'] },
    ],
  },
  {
    id: 'simulacro-3',
    title: 'Simulacro 3',
    description: 'Bloque obligatorio: Ondas y vibraciones. Los otros tres bloques van con opción A/B.',
    obligatorySectionId: 'ondas-vibraciones',
    sections: [
      { id: 'gravitacion', title: 'Gravitación', topicIds: ['03-gravitacion'] },
      { id: 'electromagnetismo', title: 'Electromagnetismo', topicIds: ['04-campo-electrico', '05-campo-magnetico', '06-induccion-electromagnetica'] },
      { id: 'ondas-vibraciones', title: 'Ondas y vibraciones', topicIds: ['01-ondas', '02-sonido', '08-optica-fisica', '09-optica-geometrica'] },
      { id: 'fisica-siglo-xx', title: 'Física del siglo XX', topicIds: ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'] },
    ],
  },
  {
    id: 'simulacro-4',
    title: 'Simulacro 4',
    description: 'Bloque obligatorio: Física del siglo XX. Los otros tres bloques van con opción A/B.',
    obligatorySectionId: 'fisica-siglo-xx',
    sections: [
      { id: 'gravitacion', title: 'Gravitación', topicIds: ['03-gravitacion'] },
      { id: 'electromagnetismo', title: 'Electromagnetismo', topicIds: ['04-campo-electrico', '05-campo-magnetico', '06-induccion-electromagnetica'] },
      { id: 'ondas-vibraciones', title: 'Ondas y vibraciones', topicIds: ['01-ondas', '02-sonido', '08-optica-fisica', '09-optica-geometrica'] },
      { id: 'fisica-siglo-xx', title: 'Física del siglo XX', topicIds: ['10-relatividad-especial', '11-fisica-cuantica', '12-fisica-nuclear'] },
    ],
  },
]

function getSectionKind(title: string): Exclude<ContentFilter, 'todo'> | 'apoyo' {
  const normalizedTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalizedTitle.includes('formula')) {
    return 'formulas'
  }

  if (normalizedTitle.includes('problemas')) {
    return 'problemas'
  }

  if (normalizedTitle.includes('ebau')) {
    return 'ebau'
  }

  if (
    normalizedTitle.includes('teoria') ||
    normalizedTitle.includes('estado') ||
    normalizedTitle.includes('fuentes')
  ) {
    return 'teoria'
  }

  return 'apoyo'
}

function getStudyPanelSymbol(kind: StudyAccordionPanel | 'apoyo') {
  switch (kind) {
    case 'teoria':
      return 'Ω'
    case 'formulas':
      return 'λ'
    case 'ebau':
      return 'Δ'
    case 'problemas':
      return 'F'
    case 'quick-formulas':
      return '∫'
    default:
      return 'φ'
  }
}

function isSourceSection(title: string) {
  const normalizedTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return (
    normalizedTitle.includes('fuentes actuales') ||
    normalizedTitle.includes('estado') ||
    normalizedTitle.includes('puntos detectados') ||
    normalizedTitle.includes('bloque extraido del dossier')
  )
}

function isTheorySummarySection(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('teoria resumida')
}

function normalizeInlineLatex(text: string) {
  return text
    .replace(/^\$+|\$+$/g, '')
    .replace(/(^|[^\\])lambda\b/gi, '$1\\lambda')
    .trim()
}

function replaceNamedSymbols(text: string) {
  return text.replace(/\blambda\b/gi, 'λ')
}

function renderTextWithMath(text: string) {
  const segments = text.split(/`([^`]+)`/g)

  return segments.map((segment, index) => {
    if (index % 2 === 1) {
      return (
        <MathFormula
          key={`${segment}-${index}`}
          latex={normalizeInlineLatex(segment)}
          inline
        />
      )
    }

    return <Fragment key={`${segment}-${index}`}>{replaceNamedSymbols(segment)}</Fragment>
  })
}

const theoryKeywordPattern =
  /(velocidad de propagaci[oó]n|velocidad de oscilaci[oó]n|onda estacionaria|principio de h(?:uy|yu)gens|unidimiensionales|unidimensionales|bidimensionales|tridimensionales|transversales|longitudinales|reflexi[oó]n|refracci[oó]n|difracci[oó]n|transporte|onda)/gi

function renderTheoryKeywordText(text: string) {
  const segments = text.split(/`([^`]+)`/g)

  return segments.map((segment, segmentIndex) => {
    if (segmentIndex % 2 === 1) {
      return (
        <MathFormula
          key={`${segment}-${segmentIndex}`}
          latex={normalizeInlineLatex(segment)}
          inline
        />
      )
    }

    return segment
      .split(theoryKeywordPattern)
      .filter((part) => part.length > 0)
      .map((part, partIndex) => {
        const key = `${segmentIndex}-${part}-${partIndex}`

        if (theoryKeywordPattern.test(part)) {
          theoryKeywordPattern.lastIndex = 0
          return <strong className="theory-keyword" key={key}>{replaceNamedSymbols(part)}</strong>
        }

        theoryKeywordPattern.lastIndex = 0
        return <Fragment key={key}>{replaceNamedSymbols(part)}</Fragment>
      })
  })
}

function getTheoryHighlightParts(text: string) {
  const trimmedText = text.trim()
  const colonIndex = trimmedText.indexOf(':')

  if (colonIndex > 0 && colonIndex <= 56) {
    return {
      lead: trimmedText.slice(0, colonIndex + 1),
      tail: trimmedText.slice(colonIndex + 1).trimStart(),
    }
  }

  return null
}

function renderTheoryText(text: string) {
  const parts = getTheoryHighlightParts(text)

  if (!parts) {
    return renderTheoryKeywordText(text)
  }

  return (
    <>
      <strong className="theory-emphasis">{renderTheoryKeywordText(parts.lead)}</strong>
      {parts.tail ? (
        <>
          {' '}
          {renderTheoryKeywordText(parts.tail)}
        </>
      ) : null}
    </>
  )
}

function getTheoryStudyTag(text: string, index: number) {
  const normalizedText = normalizeSearchText(text)

  if (/conserv|siempre|nunca|depende|no implica|cambia|no cambia/.test(normalizedText)) {
    return 'Ojo'
  }

  if (/examen|pau|calcula|problema|representa|explica|deduce/.test(normalizedText)) {
    return 'PAU'
  }

  if (/formula|ecuacion|ley|principio|teorema|relacion/.test(normalizedText)) {
    return 'Clave'
  }

  return index === 0 ? 'Clave' : 'Concepto'
}

function renderTheoryCardText(text: string) {
  return <>{renderTheoryKeywordText(text)}</>
}

function renderTheoryStudySection(
  section: { paragraphs: string[]; bullets: string[] },
  renderText: (text: string) => ReturnType<typeof renderTheoryText>,
) {
  const [mainIdea, ...extraParagraphs] = section.paragraphs

  return (
    <div className="theory-study-layout">
      {mainIdea ? (
        <article className="theory-study-main">
          <span>Idea clave</span>
          <p>{renderText(mainIdea)}</p>
        </article>
      ) : null}

      {extraParagraphs.length > 0 ? (
        <div className="theory-study-notes">
          {extraParagraphs.map((paragraph) => (
            <p key={paragraph}>{renderText(paragraph)}</p>
          ))}
        </div>
      ) : null}

      {section.bullets.length > 0 ? (
        <div className="theory-study-card-grid">
          {section.bullets.map((bullet, index) => (
            <article className="theory-study-card" key={bullet}>
              <span className={`theory-study-tag theory-study-tag-${getTheoryStudyTag(bullet, index).toLowerCase()}`}>
                {getTheoryStudyTag(bullet, index)}
              </span>
              <p>{renderTheoryCardText(bullet)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function splitHighlightedTopics(highlights: string[]) {
  const splitIndex = Math.ceil(highlights.length / 2)

  return {
    problems: highlights.slice(0, splitIndex),
    theory: highlights.slice(splitIndex),
  }
}

function normalizeSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSearchSnippet(text: string, maxLength = 116) {
  const trimmedText = text.replace(/\s+/g, ' ').trim()

  if (trimmedText.length <= maxLength) {
    return trimmedText
  }

  return `${trimmedText.slice(0, maxLength - 1).trimEnd()}…`
}

function inferPracticePattern(exercise: { title: string; prompt: string; hint: string; type: string }, topicTitle: string) {
  const text = normalizeSearchText(`${exercise.title} ${exercise.prompt} ${exercise.hint} ${exercise.type}`)

  if (/lente|espejo|focal|imagen|dioptria|miopia|hipermetropia|potencia/.test(text)) {
    return 'Óptica geométrica'
  }

  if (/interferencia|difraccion|polarizacion|refraccion|reflexion total|snell|angulo limite|indice de refraccion|prisma|luz/.test(text)) {
    return 'Óptica física'
  }

  if (/fotoelectrico|umbral|foton|planck|de broglie|cuant/.test(text)) {
    return 'Fotoeléctrico y cuántica'
  }

  if (/nuclear|radiact|alfa|beta|masa|enlace|defecto/.test(text)) {
    return 'Nuclear y radiactividad'
  }

  if (/faraday|lenz|flujo|induccion|fem|bobina/.test(text)) {
    return 'Inducción'
  }

  if (/campo magnet|lorentz|biot|particula cargada|radio|trayectoria|iman/.test(text)) {
    return 'Campo magnético'
  }

  if (/coulomb|campo electr|potencial|carga|electrostat|gauss/.test(text)) {
    return 'Campo y potencial eléctrico'
  }

  if (/orbita|kepler|gravit|satelite|planeta|escape/.test(text)) {
    return 'Gravitación y órbitas'
  }

  if (/sonido|sonora|doppler|timbre|tono|decibel|intensidad acustica|ballena|sirena/.test(text)) {
    return 'Sonido'
  }

  if (/onda|frecuencia|longitud de onda|lambda|interferencia|estacionaria|huygens|difraccion/.test(text)) {
    return 'Ondas'
  }

  if (/relativ|dilatacion|contraccion|energia total|energia cinetica relativista/.test(text)) {
    return 'Relatividad'
  }

  return topicTitle || practicePatternFallback
}

function getPracticeFormulaScore(formula: { label: string; latex: string }, exercise: { title: string; prompt: string; hint: string }) {
  const exerciseText = normalizeSearchText(`${exercise.title} ${exercise.prompt} ${exercise.hint}`)
  const formulaTokens = normalizeSearchText(`${formula.label} ${formula.latex}`)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)

  return formulaTokens.reduce((score, token) => score + (exerciseText.includes(token) ? 1 : 0), 0)
}

function formatPracticeTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatSimulationNumber(value: number, digits = 2) {
  const fixedValue = value.toFixed(digits)
  return fixedValue.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function App() {
  const [activeView, setActiveView] = useState<MainView>('inicio')
  const [selectedTopicId, setSelectedTopicId] = useState(studyModules[0]?.id ?? '')
  const [selectedFilter, setSelectedFilter] = useState<ContentFilter>('todo')
  const [isStudySidebarHidden, setIsStudySidebarHidden] = useState(false)
  const [expandedStudyPanels, setExpandedStudyPanels] = useState<Record<StudyAccordionPanel, boolean>>({
    teoria: false,
    formulas: false,
    ebau: false,
    problemas: false,
    'quick-formulas': false,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('dark')
  const [spiderMenuState, setSpiderMenuState] = useState<SpiderMenuState>('idle')
  const [windowScrollY, setWindowScrollY] = useState(0)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [selectedMockBlockId, setSelectedMockBlockId] = useState(mockExamBlocks[0]?.id ?? '')
  const [selectedSimulationId, setSelectedSimulationId] = useState<SimulationId>('ondas')
  const [waveAmplitude, setWaveAmplitude] = useState(0.85)
  const [waveFrequency, setWaveFrequency] = useState(1.4)
  const [waveSpeed, setWaveSpeed] = useState(7.2)
  const [wavePhase, setWavePhase] = useState(0)
  const [waveTime, setWaveTime] = useState(0)
  const [isWavePlaying, setIsWavePlaying] = useState(false)
  const [lensType, setLensType] = useState<'convergente' | 'divergente'>('convergente')
  const [lensFocalLength, setLensFocalLength] = useState(2.4)
  const [lensObjectDistance, setLensObjectDistance] = useState(4.8)
  const [lensObjectHeight, setLensObjectHeight] = useState(1.4)
  const [mirrorType, setMirrorType] = useState<'concavo' | 'convexo'>('concavo')
  const [mirrorFocalLength, setMirrorFocalLength] = useState(1.6)
  const [mirrorObjectDistance, setMirrorObjectDistance] = useState(3.8)
  const [mirrorObjectHeight, setMirrorObjectHeight] = useState(1.35)
  const [activePhetGroup, setActivePhetGroup] = useState<PhetGroup>('Ondas')
  const [isPracticeHintOpen, setIsPracticeHintOpen] = useState(false)
  const [isPracticeSolutionOpen, setIsPracticeSolutionOpen] = useState(false)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('todos')
  const [selectedPracticePattern, setSelectedPracticePattern] = useState('todo')
  const [practiceTimerSeconds, setPracticeTimerSeconds] = useState(0)
  const [isPracticeTimerRunning, setIsPracticeTimerRunning] = useState(false)
  const [practiceStatuses, setPracticeStatuses] = useState<Record<string, PracticeStatus>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const storedValue = window.localStorage.getItem('physics-practice-statuses')
      return storedValue ? (JSON.parse(storedValue) as Record<string, PracticeStatus>) : {}
    } catch {
      return {}
    }
  })
  const [practiceErrorTags, setPracticeErrorTags] = useState<Record<string, PracticeErrorTag[]>>(() => {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const storedValue = window.localStorage.getItem('physics-practice-error-tags')
      return storedValue ? (JSON.parse(storedValue) as Record<string, PracticeErrorTag[]>) : {}
    } catch {
      return {}
    }
  })

  const selectedModule = useMemo(
    () => studyModules.find((module) => module.id === selectedTopicId) ?? studyModules[0],
    [selectedTopicId],
  )

  const selectedSheet = topicSheetById[selectedModule.id]
  const selectedFormulaSheet = formulaSheetById[selectedModule.id]
  const selectedSimulation =
    simulationCards.find((simulation) => simulation.id === selectedSimulationId) ?? simulationCards[0]
  const phetResourceGroups = useMemo(() => {
    const groups = new Map<PhetGroup, (typeof phetResources)[number][]>()

    for (const resource of phetResources) {
      const currentGroup = groups.get(resource.group) ?? []
      currentGroup.push(resource)
      groups.set(resource.group, currentGroup)
    }

    return Array.from(groups.entries()).map(([group, resources]) => ({ group, resources }))
  }, [])
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const indexModules = useMemo(
    () =>
      studyModules
        .filter((module) => module.id !== '02-sonido')
        .map((module) =>
          module.id === '01-ondas'
            ? {
                ...module,
                title: 'Ondas + Sonido',
              }
            : module,
        ),
    [],
  )

  const searchableContent = useMemo<SearchResult[]>(() => {
    const moduleTitleById = Object.fromEntries(studyModules.map((module) => [module.id, module.title]))

    const conceptResults = topicSheets.flatMap((sheet) =>
      sheet.sections
        .filter((section) => !isSourceSection(section.title))
        .flatMap((section, sectionIndex) => {
          const entries = [...section.paragraphs, ...section.bullets]

          return entries.map((entry, entryIndex): SearchResult => ({
            id: `${sheet.id}-concept-${sectionIndex}-${entryIndex}`,
            topicId: sheet.id,
            kind: 'concepto',
            title: section.title,
            subtitle: moduleTitleById[sheet.id] ?? sheet.title,
            snippet: getSearchSnippet(entry),
          }))
        }),
    )

    const formulaResults = formulaSheets.flatMap((sheet) =>
      sheet.formulas.map((formula, formulaIndex): SearchResult => ({
        id: `${sheet.id}-formula-${formulaIndex}`,
        topicId: sheet.id,
        kind: 'formula',
        title: formula.label,
        subtitle: moduleTitleById[sheet.id] ?? sheet.title,
        snippet: formula.latex,
      })),
    )

    const nativeSimulationResults = simulationCards.map((simulation): SearchResult => ({
      id: `simulation-${simulation.id}`,
      topicId: simulation.topicId,
      kind: 'simulacion',
      title: simulation.title,
      subtitle: 'Simulación propia',
      snippet: simulation.summary,
      targetView: 'simulaciones',
      simulationId: simulation.id,
    }))

    const phetSimulationResults = phetResources.map((resource): SearchResult => ({
      id: `phet-${resource.title}`,
      topicId: resource.topicId,
      kind: 'simulacion',
      title: resource.title,
      subtitle: `PhET · ${resource.topicLabel}`,
      snippet: resource.focus,
      targetView: 'ampliacion',
    }))

    return [...conceptResults, ...formulaResults, ...nativeSimulationResults, ...phetSimulationResults]
  }, [])

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(deferredSearchQuery.trim())

    if (!normalizedQuery) {
      return []
    }

    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean)

    return searchableContent
      .filter((result) => {
        const haystack = normalizeSearchText(`${result.title} ${result.subtitle} ${result.snippet}`)
        return queryTerms.every((term) => haystack.includes(term))
      })
      .slice(0, 8)
  }, [deferredSearchQuery, searchableContent])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.remove('body-bg-steel-light', 'body-bg-cinematic-blue', 'body-bg-steel-dark', 'body-bg-ink-dark')
    document.body.classList.add(visualTheme === 'dark' ? 'body-bg-ink-dark' : 'body-bg-steel-light')

    return () => {
      document.body.classList.remove('body-bg-steel-light', 'body-bg-cinematic-blue', 'body-bg-steel-dark', 'body-bg-ink-dark')
    }
  }, [visualTheme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('physics-practice-statuses', JSON.stringify(practiceStatuses))
  }, [practiceStatuses])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('physics-practice-error-tags', JSON.stringify(practiceErrorTags))
  }, [practiceErrorTags])

  useEffect(() => {
    if (!isPracticeTimerRunning) {
      return
    }

    const timerId = window.setInterval(() => {
      setPracticeTimerSeconds((currentSeconds) => currentSeconds + 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isPracticeTimerRunning])

  const navigableSections = useMemo(
    () => selectedSheet.sections.filter((section) => !isSourceSection(section.title)),
    [selectedSheet.sections],
  )

  const visibleSections = useMemo(() => {
    if (selectedFilter === 'todo') {
      return navigableSections
    }

    return navigableSections.filter((section) => getSectionKind(section.title) === selectedFilter)
  }, [navigableSections, selectedFilter])

  const sectionColumns = useMemo(() => {
    const leftSections = visibleSections.filter((section) => {
      const kind = getSectionKind(section.title)
      return kind === 'teoria' || kind === 'ebau'
    })

    const rightSections = visibleSections.filter((section) => {
      const kind = getSectionKind(section.title)
      return kind === 'formulas' || kind === 'problemas' || kind === 'apoyo'
    })

    return {
      leftSections,
      rightSections,
    }
  }, [visibleSections])

  const problemSection = useMemo(
    () => navigableSections.find((section) => getSectionKind(section.title) === 'problemas'),
    [navigableSections],
  )

  const ebauSection = useMemo(
    () => navigableSections.find((section) => getSectionKind(section.title) === 'ebau'),
    [navigableSections],
  )

  const practiceExercises = useMemo<PracticeExercise[]>(() => {
    const practiceTopicIds = getPracticeTopicIds(selectedModule.id)
    const sheetExercises = practiceTopicIds.flatMap((topicId) => {
      const topicTitle = studyModules.find((module) => module.id === topicId)?.title ?? selectedModule.title
      const exercises = exerciseSheetById[topicId]?.exercises ?? []

      return exercises.map((exercise) => ({
        ...exercise,
        topicId,
        topicTitle,
      }))
    })

    if (sheetExercises.length) {
      return sheetExercises
    }

    const prompts = problemSection?.bullets ?? []

    return prompts.map((prompt, index) => ({
      id: `${selectedModule.id}-practice-${index}`,
      title: `Problema tipo ${index + 1}`,
      source: 'Ficha del tema',
      type: 'problema',
      difficulty: 'media',
      prompt,
      hint:
        selectedFormulaSheet.formulas[index % selectedFormulaSheet.formulas.length]?.label ??
        selectedModule.goal,
      sourcePath: '',
      topicId: selectedModule.id,
      topicTitle: selectedModule.title,
    }))
  }, [problemSection?.bullets, selectedFormulaSheet.formulas, selectedModule.goal, selectedModule.id, selectedModule.title])

  const practicePatternByExerciseId = useMemo(
    () =>
      Object.fromEntries(
        practiceExercises.map((exercise) => [
          exercise.id,
          inferPracticePattern(exercise, selectedModule.title),
        ]),
      ) as Record<string, string>,
    [practiceExercises, selectedModule.title],
  )
  const practicePatterns = useMemo(
    () => Array.from(new Set(practiceExercises.map((exercise) => practicePatternByExerciseId[exercise.id] ?? practicePatternFallback))),
    [practiceExercises, practicePatternByExerciseId],
  )
  const activePracticeTopicIds = useMemo(
    () => getPracticeTopicIds(selectedModule.id),
    [selectedModule.id],
  )
  const activePracticePdfBanks = useMemo(
    () =>
      practicePdfBanks.filter((bank) =>
        bank.topicIds.some((topicId) => activePracticeTopicIds.includes(topicId)),
      ),
    [activePracticeTopicIds],
  )
  const visiblePracticeExercises = useMemo(
    () =>
      practiceExercises.filter((exercise) => {
        const status = practiceStatuses[exercise.id] ?? 'pendiente'
        const pattern = practicePatternByExerciseId[exercise.id] ?? practicePatternFallback
        const matchesMode = practiceMode === 'todos' || status === 'fallado' || status === 'revisar'
        const matchesPattern = selectedPracticePattern === 'todo' || pattern === selectedPracticePattern

        return matchesMode && matchesPattern
      }),
    [practiceExercises, practiceMode, practicePatternByExerciseId, practiceStatuses, selectedPracticePattern],
  )
  const activePracticeExercise = visiblePracticeExercises[practiceIndex] ?? null
  const activePracticeStatus = activePracticeExercise
    ? practiceStatuses[activePracticeExercise.id] ?? 'pendiente'
    : 'pendiente'
  const activePracticePattern = activePracticeExercise
    ? practicePatternByExerciseId[activePracticeExercise.id] ?? practicePatternFallback
    : practicePatternFallback
  const activePracticeErrorTags = activePracticeExercise ? practiceErrorTags[activePracticeExercise.id] ?? [] : []
  const activePracticeFormula = useMemo(() => {
    if (!activePracticeExercise) {
      return null
    }

    const activeFormulaSheet = formulaSheetById[activePracticeExercise.topicId] ?? selectedFormulaSheet

    if (activeFormulaSheet.formulas.length === 0) {
      return null
    }

    const scoredFormulas = activeFormulaSheet.formulas.map((formula) => ({
      formula,
      score: getPracticeFormulaScore(formula, activePracticeExercise),
    }))
    const bestFormula = scoredFormulas.sort((left, right) => right.score - left.score)[0]

    return bestFormula?.formula ?? activeFormulaSheet.formulas[0]
  }, [activePracticeExercise, selectedFormulaSheet])

  const practiceStatusSummary = useMemo(() => {
    const counts: Record<PracticeStatus, number> = {
      pendiente: 0,
      hecho: 0,
      fallado: 0,
      revisar: 0,
    }

    for (const exercise of practiceExercises) {
      const status = practiceStatuses[exercise.id] ?? 'pendiente'
      counts[status] += 1
    }

    return counts
  }, [practiceExercises, practiceStatuses])

  useEffect(() => {
    setPracticeIndex(0)
    setIsPracticeHintOpen(false)
    setIsPracticeSolutionOpen(false)
    setPracticeTimerSeconds(0)
    setIsPracticeTimerRunning(false)
  }, [practiceMode, selectedPracticePattern, selectedTopicId])

  useEffect(() => {
    setSelectedPracticePattern('todo')
    setPracticeMode('todos')
  }, [selectedTopicId])

  useEffect(() => {
    if (practiceIndex >= visiblePracticeExercises.length) {
      setPracticeIndex(0)
    }
  }, [practiceIndex, visiblePracticeExercises.length])

  const waveWavelength = waveSpeed / waveFrequency
  const wavePeriod = 1 / waveFrequency
  const waveAngularFrequency = 2 * Math.PI * waveFrequency
  const waveNumber = (2 * Math.PI) / waveWavelength
  const waveProbeX = 6
  const waveAmplitudePx = 22 + waveAmplitude * 58
  const waveWavelengthPx = Math.max(36, Math.min(340, waveWavelength * 22))
  const waveProbeDisplacement =
    waveAmplitude * Math.sin(waveNumber * waveProbeX - waveAngularFrequency * waveTime + wavePhase)
  const waveProbeVelocity =
    -waveAmplitude * waveAngularFrequency * Math.cos(waveNumber * waveProbeX - waveAngularFrequency * waveTime + wavePhase)
  const wavePath = useMemo(() => {
    const width = 780
    const height = 260
    const centerY = height / 2
    const points: string[] = []
    const sampleStep = Math.max(2, Math.min(8, waveWavelengthPx / 18))

    for (let x = 0; x <= width; x += sampleStep) {
      const angle = (2 * Math.PI * x) / waveWavelengthPx - waveAngularFrequency * waveTime + wavePhase
      const y = centerY - waveAmplitudePx * Math.sin(angle)
      points.push(`${x},${y}`)
    }

    return points.join(' ')
  }, [waveAmplitudePx, waveAngularFrequency, wavePhase, waveTime, waveWavelengthPx])
  const waveProbeY = useMemo(() => {
    const centerY = 130
    const probeXPx = 610
    const angle = (2 * Math.PI * probeXPx) / waveWavelengthPx - waveAngularFrequency * waveTime + wavePhase
    return centerY - waveAmplitudePx * Math.sin(angle)
  }, [waveAmplitudePx, waveAngularFrequency, wavePhase, waveTime, waveWavelengthPx])
  const waveGuide = useMemo(() => {
    const width = 780
    const crestPhaseOffset = (Math.PI / 2 + waveAngularFrequency * waveTime - wavePhase) / (2 * Math.PI)
    const baseOffset = (((crestPhaseOffset * waveWavelengthPx) % waveWavelengthPx) + waveWavelengthPx) % waveWavelengthPx
    let crestStartX = baseOffset

    while (crestStartX < 56) {
      crestStartX += waveWavelengthPx
    }

    while (crestStartX + waveWavelengthPx > width - 56) {
      crestStartX -= waveWavelengthPx
    }

    if (crestStartX < 56) {
      crestStartX = 56
    }

    const crestEndX = Math.min(width - 56, crestStartX + waveWavelengthPx)

    return {
      crestStartX,
      crestEndX,
      crestLabelX: (crestStartX + crestEndX) / 2,
      crestY: 130 - waveAmplitudePx,
      lambdaY: 34,
    }
  }, [waveAmplitudePx, waveAngularFrequency, wavePhase, waveTime, waveWavelengthPx])
  const waveEquationLatex = useMemo(
    () => {
      const phaseTerm = Math.abs(wavePhase) < 0.01
        ? ''
        : `${wavePhase >= 0 ? '+' : '-'}${formatSimulationNumber(Math.abs(wavePhase), 2)}`

      return `y(x,t)=${formatSimulationNumber(waveAmplitude, 2)}\\sin\\left(kx-\\omega t${phaseTerm}\\right)`
    },
    [waveAmplitude, wavePhase],
  )
  const lensSignedFocalLength = lensType === 'convergente' ? lensFocalLength : -lensFocalLength
  const lensImageDistanceReciprocal = 1 / lensSignedFocalLength - 1 / lensObjectDistance
  const lensImageAtInfinity = Math.abs(lensImageDistanceReciprocal) < 0.015
  const lensImageDistance = lensImageAtInfinity ? Number.POSITIVE_INFINITY : 1 / lensImageDistanceReciprocal
  const lensMagnification = lensImageAtInfinity ? Number.POSITIVE_INFINITY : -lensImageDistance / lensObjectDistance
  const lensImageHeight = lensImageAtInfinity ? Number.POSITIVE_INFINITY : lensMagnification * lensObjectHeight
  const lensImageNature = lensImageAtInfinity ? 'impropia' : lensImageDistance > 0 ? 'real' : 'virtual'
  const lensImageOrientation = lensImageAtInfinity ? 'indefinida' : lensImageHeight < 0 ? 'invertida' : 'derecha'
  const lensObjectRegion = useMemo(() => {
    if (lensType === 'divergente') {
      return 'en una configuración que siempre genera imagen virtual y derecha'
    }

    if (lensObjectDistance > 2 * lensFocalLength) {
      return 'más allá de 2F'
    }

    if (Math.abs(lensObjectDistance - 2 * lensFocalLength) < 0.12) {
      return 'cerca de 2F'
    }

    if (lensObjectDistance > lensFocalLength) {
      return 'entre F y 2F'
    }

    if (Math.abs(lensObjectDistance - lensFocalLength) < 0.12) {
      return 'casi en F'
    }

    return 'dentro de la distancia focal'
  }, [lensFocalLength, lensObjectDistance, lensType])
  const lensEquationLatex = useMemo(() => String.raw`\frac{1}{s}-\frac{1}{s'}=\frac{1}{f'}`, [])
  const lensScene = useMemo(() => {
    const width = 780
    const height = 280
    const axisY = 146
    const lensX = 390
    const leftBound = 28
    const rightBound = width - 28
    const distanceScale = 38
    const heightScale = 42
    const objectX = Math.max(leftBound + 18, lensX - lensObjectDistance * distanceScale)
    const objectTipY = axisY - lensObjectHeight * heightScale
    const focusOffset = lensFocalLength * distanceScale
    const leftFocusX = lensX - focusOffset
    const rightFocusX = lensX + focusOffset
    const leftDoubleFocusX = lensX - focusOffset * 2
    const rightDoubleFocusX = lensX + focusOffset * 2
    const imageX = lensImageAtInfinity ? rightBound : lensX + lensImageDistance * distanceScale
    const imageXClamped = Math.max(leftBound, Math.min(rightBound, imageX))
    const imageTipY = lensImageAtInfinity ? axisY : axisY - lensImageHeight * heightScale

    const projectY = (x1: number, y1: number, x2: number, y2: number, targetX: number) => {
      if (Math.abs(x2 - x1) < 0.001) {
        return y2
      }

      const slope = (y2 - y1) / (x2 - x1)
      return y1 + slope * (targetX - x1)
    }

    const centralRayExitY = projectY(objectX, objectTipY, lensX, axisY, rightBound)
    const virtualParallelExitY = projectY(lensX, objectTipY, imageXClamped, imageTipY, rightBound)
    const focusTargetX = lensType === 'convergente' ? leftFocusX : rightFocusX
    const focusRayEntryY = projectY(objectX, objectTipY, focusTargetX, axisY, lensX)
    const virtualCenterBacktraceY = projectY(lensX, axisY, rightBound, centralRayExitY, imageXClamped)
    const shouldBacktraceToImage = !lensImageAtInfinity && lensImageDistance < 0

    return {
      width,
      height,
      axisY,
      lensX,
      leftBound,
      rightBound,
      objectX,
      objectTipY,
      imageX: imageXClamped,
      imageTipY,
      leftFocusX,
      rightFocusX,
      leftDoubleFocusX,
      rightDoubleFocusX,
      centralRayExitY,
      virtualParallelExitY,
      focusRayEntryY,
      focusTargetX,
      virtualCenterBacktraceY,
      shouldBacktraceToImage,
    }
  }, [lensFocalLength, lensImageAtInfinity, lensImageDistance, lensImageHeight, lensObjectDistance, lensObjectHeight, lensType])
  const mirrorSignedFocalLength = mirrorType === 'concavo' ? mirrorFocalLength : -mirrorFocalLength
  const mirrorImageDistanceReciprocal = 1 / mirrorSignedFocalLength - 1 / mirrorObjectDistance
  const mirrorImageAtInfinity = mirrorType === 'concavo' && Math.abs(mirrorImageDistanceReciprocal) < 0.015
  const mirrorImageDistance = mirrorImageAtInfinity ? Number.POSITIVE_INFINITY : 1 / mirrorImageDistanceReciprocal
  const mirrorMagnification = mirrorImageAtInfinity ? Number.POSITIVE_INFINITY : -mirrorImageDistance / mirrorObjectDistance
  const mirrorImageHeight = mirrorImageAtInfinity ? Number.POSITIVE_INFINITY : mirrorMagnification * mirrorObjectHeight
  const mirrorImageNature = mirrorImageAtInfinity ? 'impropia' : mirrorImageDistance > 0 ? 'real' : 'virtual'
  const mirrorImageOrientation = mirrorImageAtInfinity ? 'indefinida' : mirrorImageHeight < 0 ? 'invertida' : 'derecha'
  const mirrorObjectRegion = useMemo(() => {
    if (mirrorType === 'convexo') {
      return 'en una configuración que siempre genera imagen virtual, derecha y reducida'
    }

    if (mirrorObjectDistance > 2 * mirrorFocalLength) {
      return 'más allá de C'
    }

    if (Math.abs(mirrorObjectDistance - 2 * mirrorFocalLength) < 0.12) {
      return 'cerca de C'
    }

    if (mirrorObjectDistance > mirrorFocalLength) {
      return 'entre C y F'
    }

    if (Math.abs(mirrorObjectDistance - mirrorFocalLength) < 0.12) {
      return 'casi en F'
    }

    return 'entre el vértice y el foco'
  }, [mirrorFocalLength, mirrorObjectDistance, mirrorType])
  const mirrorEquationLatex = useMemo(() => String.raw`\frac{1}{s}+\frac{1}{s'}=\frac{1}{f}`, [])
  const mirrorScene = useMemo(() => {
    const width = 780
    const height = 280
    const axisY = 146
    const mirrorX = 548
    const leftBound = 30
    const rightBound = width - 30
    const distanceScale = 42
    const heightScale = 42
    const objectX = Math.max(leftBound + 18, mirrorX - mirrorObjectDistance * distanceScale)
    const objectTipY = axisY - mirrorObjectHeight * heightScale
    const focusX = mirrorX - mirrorSignedFocalLength * distanceScale
    const centerX = mirrorX - 2 * mirrorSignedFocalLength * distanceScale
    const imageX = mirrorImageAtInfinity ? leftBound : mirrorX - mirrorImageDistance * distanceScale
    const imageXClamped = Math.max(leftBound, Math.min(rightBound, imageX))
    const imageTipY = mirrorImageAtInfinity ? axisY : axisY - mirrorImageHeight * heightScale

    const projectY = (x1: number, y1: number, x2: number, y2: number, targetX: number) => {
      if (Math.abs(x2 - x1) < 0.001) {
        return y2
      }

      const slope = (y2 - y1) / (x2 - x1)
      return y1 + slope * (targetX - x1)
    }

    const parallelRayLeftY = mirrorImageAtInfinity
      ? projectY(mirrorX, objectTipY, focusX, axisY, leftBound)
      : projectY(mirrorX, objectTipY, imageXClamped, imageTipY, leftBound)
    const focusRayHitY = projectY(objectX, objectTipY, focusX, axisY, mirrorX)
    const centerRayHitY = projectY(objectX, objectTipY, centerX, axisY, mirrorX)
    const centerRayLeftY = mirrorImageAtInfinity
      ? projectY(mirrorX, centerRayHitY, objectX, objectTipY, leftBound)
      : projectY(mirrorX, centerRayHitY, imageXClamped, imageTipY, leftBound)
    const shouldBacktraceToImage = !mirrorImageAtInfinity && mirrorImageDistance < 0

    return {
      width,
      height,
      axisY,
      mirrorX,
      leftBound,
      rightBound,
      objectX,
      objectTipY,
      imageX: imageXClamped,
      imageTipY,
      focusX,
      centerX,
      parallelRayLeftY,
      focusRayHitY,
      centerRayHitY,
      centerRayLeftY,
      shouldBacktraceToImage,
    }
  }, [mirrorFocalLength, mirrorImageAtInfinity, mirrorImageDistance, mirrorImageHeight, mirrorObjectDistance, mirrorObjectHeight, mirrorSignedFocalLength])

  useEffect(() => {
    if (spiderMenuState !== 'climbing-up' && spiderMenuState !== 'climbing-down') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSpiderMenuState((currentState) =>
        currentState === 'climbing-up'
          ? 'hidden'
          : currentState === 'climbing-down'
            ? 'idle'
            : currentState,
      )
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [spiderMenuState])

  useEffect(() => {
    setIsPracticeHintOpen(false)
  }, [activePracticeExercise?.id])

  useEffect(() => {
    if (activeView !== 'simulaciones' || selectedSimulationId !== 'ondas' || !isWavePlaying) {
      return
    }

    const intervalId = window.setInterval(() => {
      setWaveTime((currentTime) => (currentTime + 0.04) % 12)
    }, 40)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeView, isWavePlaying, selectedSimulationId])

  useEffect(() => {
    if (activeView !== 'simulaciones') {
      setIsWavePlaying(false)
    }
  }, [activeView])

  useEffect(() => {
    const syncScrollPosition = () => {
      setWindowScrollY(window.scrollY)
    }

    syncScrollPosition()
    window.addEventListener('scroll', syncScrollPosition, { passive: true })

    return () => {
      window.removeEventListener('scroll', syncScrollPosition)
    }
  }, [])

  const bubbleVisibility = Math.max(0, 1 - windowScrollY / 120)

  function openTopic(topicId: string) {
    setSelectedTopicId(topicId)
    setSelectedFilter('todo')
    setExpandedStudyPanels({
      teoria: false,
      formulas: false,
      ebau: false,
      problemas: false,
      'quick-formulas': false,
    })
    setPracticeIndex(0)
  }

  function changePracticeTopic(topicId: string) {
    openTopic(topicId)
    setPracticeMode('todos')
    setSelectedPracticePattern('todo')
    setIsPracticeHintOpen(false)
    setIsPracticeSolutionOpen(false)
    setPracticeTimerSeconds(0)
    setIsPracticeTimerRunning(false)
  }

  function setStudyPanelsForFilter(filter: ContentFilter) {
    if (filter === 'teoria') {
      setExpandedStudyPanels((currentPanels) => ({
        ...currentPanels,
        teoria: true,
      }))
      return
    }

    if (filter === 'formulas') {
      setExpandedStudyPanels((currentPanels) => ({
        ...currentPanels,
        formulas: true,
        'quick-formulas': true,
      }))
      return
    }

    if (filter === 'ebau') {
      setExpandedStudyPanels((currentPanels) => ({
        ...currentPanels,
        ebau: true,
      }))
      return
    }

    if (filter === 'problemas') {
      setExpandedStudyPanels((currentPanels) => ({
        ...currentPanels,
        problemas: true,
      }))
      return
    }

    if (filter === 'todo') {
      setExpandedStudyPanels({
        teoria: false,
        formulas: false,
        ebau: false,
        problemas: false,
        'quick-formulas': false,
      })
    }
  }

  function changeFilter(filter: ContentFilter) {
    setSelectedFilter(filter)
    setStudyPanelsForFilter(filter)
    setPracticeIndex(0)
  }

  function toggleStudyPanel(panel: StudyAccordionPanel) {
    setExpandedStudyPanels((currentPanels) => ({
      ...currentPanels,
      [panel]: !currentPanels[panel],
    }))
  }

  function selectMockBlock(blockId: string) {
    setSelectedMockBlockId(blockId)
  }

  function goToNextPrompt(direction: 'next' | 'prev') {
    if (visiblePracticeExercises.length === 0) {
      return
    }

    setPracticeIndex((currentIndex) => {
      if (direction === 'next') {
        return (currentIndex + 1) % visiblePracticeExercises.length
      }

      return (currentIndex - 1 + visiblePracticeExercises.length) % visiblePracticeExercises.length
    })
    setIsPracticeHintOpen(false)
    setIsPracticeSolutionOpen(false)
    setPracticeTimerSeconds(0)
    setIsPracticeTimerRunning(false)
  }

  function jumpToRandomPrompt() {
    if (visiblePracticeExercises.length <= 1) {
      return
    }

    setPracticeIndex((currentIndex) => {
      const randomOffset = Math.floor(Math.random() * (visiblePracticeExercises.length - 1)) + 1
      return (currentIndex + randomOffset) % visiblePracticeExercises.length
    })
    setIsPracticeHintOpen(false)
    setIsPracticeSolutionOpen(false)
    setPracticeTimerSeconds(0)
    setIsPracticeTimerRunning(false)
  }

  function setPracticeStatus(status: PracticeStatus) {
    if (!activePracticeExercise) {
      return
    }

    setPracticeStatuses((currentStatuses) => ({
      ...currentStatuses,
      [activePracticeExercise.id]: status,
    }))
  }

  function togglePracticeErrorTag(tag: PracticeErrorTag) {
    if (!activePracticeExercise) {
      return
    }

    setPracticeErrorTags((currentTags) => {
      const exerciseTags = currentTags[activePracticeExercise.id] ?? []
      const nextTags = exerciseTags.includes(tag)
        ? exerciseTags.filter((currentTag) => currentTag !== tag)
        : [...exerciseTags, tag]

      return {
        ...currentTags,
        [activePracticeExercise.id]: nextTags,
      }
    })
  }

  function selectPracticeExercise(index: number) {
    setPracticeIndex(index)
    setIsPracticeHintOpen(false)
    setIsPracticeSolutionOpen(false)
    setPracticeTimerSeconds(0)
    setIsPracticeTimerRunning(false)
  }

  function openSearchResult(result: SearchResult) {
    if (result.kind === 'simulacion') {
      if (result.simulationId) {
        setSelectedSimulationId(result.simulationId)
      }
      setSelectedTopicId(result.topicId)
      setActiveView(result.targetView ?? 'simulaciones')
      setSearchQuery('')
      setIsSearchOpen(false)
      return
    }

    setActiveView('estudio')
    setSelectedTopicId(result.topicId)
    setSelectedFilter(result.kind === 'formula' ? 'formulas' : 'todo')
    setStudyPanelsForFilter(result.kind === 'formula' ? 'formulas' : 'todo')
    setPracticeIndex(0)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  function openStudyFromSimulation(topicId: string, filter: ContentFilter = 'todo') {
    openTopic(topicId)
    if (filter !== 'todo') {
      setSelectedFilter(filter)
      setStudyPanelsForFilter(filter)
    }
    setActiveView('estudio')
  }

  function openPracticeFromSimulation(topicId: string) {
    openTopic(topicId)
    setActiveView('practica')
  }

  function openNativeSimulation(simulationId: SimulationId) {
    setSelectedSimulationId(simulationId)
    setActiveView('simulaciones')
  }

  function selectMainView(view: MainView) {
    setActiveView(view)
    setIsSearchOpen(false)
  }

  function toggleVisualTheme() {
    setVisualTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
    setIsSearchOpen(false)
  }

  function openMockFromSimulation(topicId: string) {
    const relatedBlock = mockExamBlocks.find((block) =>
      block.sections.some((section) => section.topicIds.includes(topicId)),
    )

    if (relatedBlock) {
      selectMockBlock(relatedBlock.id)
    }

    setSelectedTopicId(topicId)
    setActiveView('simulacros')
  }

  return (
    <main className="app-shell">
      <div className="top-bar">
        <nav className="top-menu" aria-label="Menu principal">
          {mainViewOrder.map((view) => (
            <button
              key={view}
              className={`top-menu-tab ${activeView === view ? 'top-menu-tab-active' : ''}`}
              type="button"
              onClick={() => selectMainView(view)}
            >
              {mainViewLabels[view]}
            </button>
          ))}
          <button
            className="top-menu-tab top-menu-theme-toggle"
            type="button"
            onClick={toggleVisualTheme}
            aria-pressed={visualTheme === 'dark'}
            aria-label={visualTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={visualTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              <span className={visualTheme === 'dark' ? 'theme-pixel-icon theme-pixel-moon' : 'theme-pixel-icon theme-pixel-sun'} />
            </span>
          </button>
        </nav>

        <button
          className={`menu-spider-trigger menu-spider-trigger-${spiderMenuState}`}
          type="button"
          aria-label="Hacer que Spider-Man suba por la cuerda"
          onClick={() => {
            if (spiderMenuState === 'idle') {
              setSpiderMenuState('climbing-up')
            }
          }}
        >
          <img
            className="menu-spider-figure"
            src="/fonts/Hanging Spider-Man.png"
            alt="Figura de Spider-Man colgando de la barra de menu"
          />
        </button>

        {spiderMenuState === 'hidden' ? (
          <button
            className="menu-spider-bubble"
            type="button"
            aria-label="Hacer que Spider-Man vuelva a bajar"
            style={{
              opacity: bubbleVisibility,
              pointerEvents: bubbleVisibility < 0.12 ? 'none' : 'auto',
            }}
            onClick={() => setSpiderMenuState('climbing-down')}
          >
            <span>YO! GET ME OUTTA HERE</span>
          </button>
        ) : null}

        <div className="top-bar-reserved-space" aria-hidden="true" />

        <div
          className={`search-widget ${isSearchOpen || searchQuery.trim() ? 'search-widget-open' : ''}`}
          onMouseEnter={() => setIsSearchOpen(true)}
          onMouseLeave={() => {
            if (!searchQuery.trim()) {
              setIsSearchOpen(false)
            }
          }}
          onFocus={() => setIsSearchOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsSearchOpen(false)
            }
          }}
        >
          <button className="search-toggle" type="button" aria-label="Buscar conceptos o formulas">
            🔍
          </button>
          <div className="search-panel">
            <input
              className="search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar conceptos o formulas"
              aria-label="Buscar conceptos o formulas"
            />

            {searchQuery.trim() ? (
              <div className="search-results" role="listbox" aria-label="Resultados de busqueda">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="search-result"
                      type="button"
                      onClick={() => openSearchResult(result)}
                    >
                      <span className={`search-result-kind search-result-kind-${result.kind}`}>
                        {result.kind}
                      </span>
                      <strong>{result.title}</strong>
                      <small>{result.subtitle}</small>
                      <p>{result.snippet}</p>
                    </button>
                  ))
                ) : (
                  <div className="search-empty-state">
                    <strong>Sin coincidencias</strong>
                    <p>Prueba con otra palabra clave o una formula mas corta.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="search-hint">Busca por concepto, tema o formula.</div>
            )}
          </div>
        </div>
      </div>

      {activeView === 'estudio' ? (
        <section className="study-quote-box" aria-label="Cita inspiradora de estudio">
          <div className="study-quote-copy">
            <p>
              "Necesitamos enseñar a que la duda no sea temida, sino bienvenida y debatida. No hay problema en decir : 'No lo sé'."
            </p>
            <span>- Richard Feynman</span>
          </div>
          <img
            className="study-quote-portrait"
            src="https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Richard_Feynman_Nobel.jpg/250px-Richard_Feynman_Nobel.jpg"
            alt="Retrato de Richard Feynman"
          />
        </section>
      ) : null}

      {activeView === 'inicio' ? (
        <>
          <section className="hero home-canvas">
            <aside className="home-timeline" aria-label="Timeline de temas">
              <p className="home-kicker">Timeline</p>
              <ol className="home-timeline-list">
                {studyModules.map((module, index) => (
                  <li key={module.id}>
                    <button
                      className="home-timeline-item"
                      type="button"
                      onClick={() => {
                        openTopic(module.id)
                        setActiveView('estudio')
                      }}
                    >
                      <span className="home-timeline-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="home-timeline-title">{module.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="home-billboard">
              <p className="home-overline">Archivo central del curso</p>
              <div className="home-title-stack">
                <span className="home-title-main" aria-label="Física">
                  <span>F</span>
                  <span className="home-title-accented">i</span>
                  <span>sica</span>
                </span>
                <span className="home-title-sub" aria-label="2º de bachillerato">
                  <span className="home-title-number" aria-hidden="true" />
                  <span className="home-title-ordinal">o</span>
                  <span> de bachillerato</span>
                </span>
              </div>
              <p className="home-copy">
                Abre cada bloque del temario desde una portada más visual: teoría, fórmulas,
                cuestiones EBAU y práctica real agrupadas por tema dentro de una misma interfaz.
              </p>

              <div className="home-summary-strip">
                {coverageSummary.slice(0, 3).map((item) => (
                  <article className="home-summary-chip" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </div>

            <aside className="home-side-stack" aria-label="Estado rápido de la portada">
              <article className="home-side-card">
                <p className="panel-label">Estado</p>
                <strong>Temario operativo</strong>
                <p>
                  Las fichas reales ya están cargadas y se abren desde la app con teoría, fórmulas
                  y práctica asociada.
                </p>
              </article>

              <article className="home-side-card home-side-card-alert">
                <p className="panel-label">Qué hacer ahora</p>
                <ul className="home-side-list">
                  {homeStudySuggestions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </article>
            </aside>

            <div className="home-physicists" aria-label="Físicos destacados">
              {homePhysicists.map((physicist) => (
                <figure className="home-physicist-card" key={physicist.name}>
                  <img src={physicist.image} alt={`Retrato de ${physicist.name}`} />
                  <figcaption>
                    <span>{physicist.role}</span>
                    <strong>{physicist.name}</strong>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeView === 'resumen' ? (
        <section className="card">
          <div className="section-heading">
            <p className="eyebrow">Índice por tema</p>
            <h2>Teoría, fórmulas y práctica disponibles</h2>
          </div>
          <div className="module-grid">
            {indexModules.map((module) => (
              <article
                className={`module-card ${selectedTopicId === module.id ? 'module-card-active' : ''}`}
                key={module.id}
              >
                <div className="module-head">
                  <div>
                    <h3>{module.title}</h3>
                  </div>
                  <span className={`coverage-pill ${coverageTone[module.coverage]}`}>
                    Cobertura {module.coverage}
                  </span>
                </div>
                <p className="module-points-label">Puntos importantes del temario</p>
                {module.id === '01-ondas' ? (
                  (() => {
                    const splitHighlights = splitHighlightedTopics(module.highlights)

                    return (
                      <div className="topic-columns">
                        <section className="topic-column-card">
                          <h4>Problemas</h4>
                          <ul className="topic-column-list">
                            {splitHighlights.problems.map((highlight) => (
                              <li key={highlight}>{highlight}</li>
                            ))}
                          </ul>
                        </section>
                        <section className="topic-column-card">
                          <h4>Teoría</h4>
                          <ul className="topic-column-list">
                            {splitHighlights.theory.map((highlight) => (
                              <li key={highlight}>{highlight}</li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    )
                  })()
                ) : (
                  <ul className="tag-list">
                    {module.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                )}
                <button
                  className="module-action"
                  type="button"
                  onClick={() => {
                    openTopic(module.id)
                    setActiveView('estudio')
                  }}
                >
                  Abrir ficha
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'estudio' ? (
        <section className="card topic-viewer">
          <div className="section-heading topic-viewer-heading">
            <p className="eyebrow">Ficha navegable</p>
            <h2>{selectedSheet.title}</h2>
          </div>
          <div className={`topic-layout ${isStudySidebarHidden ? 'topic-layout-sidebar-hidden' : ''}`}>
            <aside
              className={`topic-sidebar-shell ${isStudySidebarHidden ? 'topic-sidebar-shell-hidden' : ''}`}
              aria-label="Selección de temas"
            >
              <button
                className="topic-sidebar-toggle topic-sidebar-toggle-atom"
                type="button"
                aria-label={isStudySidebarHidden ? 'Mostrar índice' : 'Ocultar índice'}
                title={isStudySidebarHidden ? 'Mostrar índice' : 'Ocultar índice'}
                onClick={() => setIsStudySidebarHidden((currentValue) => !currentValue)}
              >
                <span aria-hidden="true">⚛</span>
              </button>

              {!isStudySidebarHidden ? (
                <div className="topic-sidebar">
                  {studyModules.map((module) => (
                    <button
                      key={module.id}
                      className={`topic-tab ${selectedTopicId === module.id ? 'topic-tab-active' : ''}`}
                      type="button"
                      onClick={() => openTopic(module.id)}
                    >
                      <span>{module.title}</span>
                      <small>Ver ficha</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="topic-sidebar-mini-nav" aria-label="Atajos por tema">
                  {studyModules.map((module, index) => {
                    const topicNumberMatch = module.title.match(/^(\d+)/)
                    const topicLabel = topicNumberMatch?.[1] ?? String(index + 1).padStart(2, '0')

                    return (
                      <button
                        key={module.id}
                        className={`topic-mini-tab ${selectedTopicId === module.id ? 'topic-mini-tab-active' : ''}`}
                        type="button"
                        aria-label={`Abrir ficha del tema ${module.title}`}
                        title={module.title}
                        onClick={() => openTopic(module.id)}
                      >
                        <span>{topicLabel}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </aside>

            <article className="topic-sheet">
              <div className="topic-sheet-head">
                <div>
                  <p className="panel-label">Objetivo</p>
                  <h3>{selectedModule.title}</h3>
                  <p>{selectedModule.goal}</p>
                </div>
                <div className="topic-sheet-actions">
                  <span className={`coverage-pill ${coverageTone[selectedModule.coverage]}`}>
                    Cobertura {selectedModule.coverage}
                  </span>
                </div>
              </div>

              <div className="filter-bar" aria-label="Filtros de contenido">
                {(Object.keys(filterLabels) as ContentFilter[]).map((filter) => (
                  <button
                    key={filter}
                    className={`filter-chip ${selectedFilter === filter ? 'filter-chip-active' : ''}`}
                    type="button"
                    onClick={() => changeFilter(filter)}
                  >
                    {filterLabels[filter]}
                  </button>
                ))}
              </div>

              <div
                className={`topic-section-grid ${selectedFilter !== 'todo' ? 'topic-section-grid-single-column' : ''}`}
              >
                {[sectionColumns.leftSections, sectionColumns.rightSections].map((columnSections, columnIndex) => (
                  <div className="topic-section-column" key={`column-${columnIndex}`}>
                    {columnSections.map((section) => {
                  const sectionKind = getSectionKind(section.title)
                  const collapsiblePanel =
                    sectionKind === 'teoria' ||
                    sectionKind === 'formulas' ||
                    sectionKind === 'ebau' ||
                    sectionKind === 'problemas'
                      ? sectionKind
                      : null
                  const isExpanded = collapsiblePanel ? expandedStudyPanels[collapsiblePanel] : true
                  const sectionClassName = `topic-section-card topic-section-card-${sectionKind}`
                  const sectionTitle = getSectionTitleLabel(section.title, sectionKind)
                  const sectionSymbol = getStudyPanelSymbol(collapsiblePanel ?? sectionKind)

                  return (
                    <section className={sectionClassName} key={section.title}>
                      {collapsiblePanel ? (
                        <button
                          className={`topic-section-toggle ${isExpanded ? 'topic-section-toggle-open' : ''}`}
                          type="button"
                          onClick={() => toggleStudyPanel(collapsiblePanel)}
                        >
                          <span>{sectionTitle}</span>
                          <strong aria-hidden="true">{sectionSymbol}</strong>
                        </button>
                      ) : (
                        <h4>{sectionTitle}</h4>
                      )}

                      {isExpanded ? (
                        <div className={`topic-section-body ${isTheorySummarySection(section.title) ? 'topic-section-body-study' : ''}`}>
                          {isTheorySummarySection(section.title) ? (
                            renderTheoryStudySection(section, renderTheoryText)
                          ) : (
                            section.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))
                          )}
                          {sectionKind === 'formulas' ? (
                            <div
                              className={`inline-formula-list ${selectedFilter === 'formulas' ? 'inline-formula-list-double' : ''}`}
                            >
                              {selectedFormulaSheet.formulas.map((formula) => (
                                <article className="inline-formula-card" key={formula.label}>
                                  <span className="formula-label">{formula.label}</span>
                                  <MathFormula latex={formula.latex} />
                                </article>
                              ))}
                            </div>
                          ) : !isTheorySummarySection(section.title) && section.bullets.length > 0 ? (
                            <ul>
                              {section.bullets.map((bullet) => (
                                <li key={bullet}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </section>
                  )
                    })}
                  </div>
                ))}

                {(selectedFilter === 'todo' || selectedFilter === 'formulas') ? (
                  <section className="topic-section-card topic-section-card-quick-formulas">
                    <button
                      className={`formula-viewer-toggle ${expandedStudyPanels['quick-formulas'] ? 'formula-viewer-toggle-open' : ''}`}
                      type="button"
                      onClick={() => toggleStudyPanel('quick-formulas')}
                    >
                      <div className="section-heading formula-heading">
                        <div>
                          <p className="eyebrow">Formulario rápido</p>
                          <h2>{selectedFormulaSheet.title}</h2>
                        </div>
                        <p className="formula-note">
                          Resumen de ecuaciones clave para repasar el tema seleccionado antes de hacer
                          ejercicios o simulacros.
                        </p>
                      </div>
                      <span className="formula-viewer-toggle-label">
                        {getStudyPanelSymbol('quick-formulas')}
                      </span>
                    </button>
                    {expandedStudyPanels['quick-formulas'] ? (
                      <div className="formula-grid">
                        {selectedFormulaSheet.formulas.map((formula) => (
                          <article className="formula-card" key={formula.label}>
                            <span className="formula-label">{formula.label}</span>
                            <MathFormula latex={formula.latex} />
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}
                {visibleSections.length === 0 ? (
                  <section className="topic-section-card topic-empty-state">
                    <h4>Sin bloques para este filtro</h4>
                    <p>
                      Este tema no tiene una sección separada para {filterLabels[selectedFilter].toLowerCase()}.
                      Prueba con la vista completa o con otro filtro.
                    </p>
                  </section>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeView === 'practica' ? (
        <section className="card practice-viewer">
          <div className="section-heading practice-heading">
            <div>
              <p className="eyebrow">Modo práctica</p>
              <h2>Entrena {selectedModule.title}</h2>
            </div>
          </div>
          <div className="practice-control-panel" aria-label="Controles de práctica">
            <div className="practice-control-group practice-topic-control">
              <span className="panel-label">Bloque</span>
              <div className="filter-bar">
                {studyModules.map((module) => (
                  <button
                    key={module.id}
                    className={`filter-chip ${selectedTopicId === module.id ? 'filter-chip-active' : ''}`}
                    type="button"
                    onClick={() => changePracticeTopic(module.id)}
                  >
                    {module.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="practice-control-row">
              <div className="practice-control-group">
                <span className="panel-label">Cola</span>
                <div className="filter-bar">
                  {(Object.keys(practiceModeLabels) as PracticeMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={`filter-chip ${practiceMode === mode ? 'filter-chip-active' : ''}`}
                      type="button"
                      onClick={() => setPracticeMode(mode)}
                    >
                      {practiceModeLabels[mode]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="practice-control-group">
                <span className="panel-label">Patrón</span>
                <div className="filter-bar">
                  <button
                    className={`filter-chip ${selectedPracticePattern === 'todo' ? 'filter-chip-active' : ''}`}
                    type="button"
                    onClick={() => setSelectedPracticePattern('todo')}
                  >
                    Todos
                  </button>
                  {practicePatterns.map((pattern) => (
                    <button
                      key={pattern}
                      className={`filter-chip ${selectedPracticePattern === pattern ? 'filter-chip-active' : ''}`}
                      type="button"
                      onClick={() => setSelectedPracticePattern(pattern)}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {activePracticeExercise ? (
            <div className="practice-layout">
              <article className="practice-card featured-practice-card">
                <span className="panel-label">
                  Ejercicio {practiceIndex + 1} de {visiblePracticeExercises.length} · {activePracticePattern}
                </span>
                <h3>{activePracticeExercise.title}</h3>
                <p className="practice-meta">
                  {activePracticeExercise.topicTitle} · {activePracticeExercise.source} · {activePracticeExercise.type} · dificultad {activePracticeExercise.difficulty}
                </p>
                <div className="practice-timer-card">
                  <div>
                    <span className="panel-label">Tiempo del ejercicio</span>
                    <strong>{formatPracticeTimer(practiceTimerSeconds)}</strong>
                  </div>
                  <div className="practice-timer-actions">
                    <button
                      className="practice-button practice-button-muted"
                      type="button"
                      onClick={() => setIsPracticeTimerRunning((currentValue) => !currentValue)}
                    >
                      {isPracticeTimerRunning ? 'Pausar' : practiceTimerSeconds > 0 ? 'Reanudar' : 'Iniciar'}
                    </button>
                    <button
                      className="practice-button practice-button-muted"
                      type="button"
                      onClick={() => {
                        setPracticeTimerSeconds(0)
                        setIsPracticeTimerRunning(false)
                      }}
                    >
                      Reiniciar
                    </button>
                  </div>
                </div>
                <div className="practice-prompt-box">
                  <span className="panel-label">Enunciado</span>
                  <p className="practice-rich-text">{renderTextWithMath(activePracticeExercise.prompt)}</p>
                </div>
                <p>{selectedModule.goal}</p>
                <div className="practice-hint-box">
                  <button
                    className={`practice-hint-toggle ${isPracticeHintOpen ? 'practice-hint-toggle-open' : ''}`}
                    type="button"
                    onClick={() => setIsPracticeHintOpen((currentValue) => !currentValue)}
                  >
                    <span className="panel-label">¿Necesitas una mano?</span>
                    <strong />
                  </button>
                  {isPracticeHintOpen ? (
                    <div className="practice-hint-content">
                      <strong className="practice-rich-text">{renderTextWithMath(activePracticeExercise.hint)}</strong>
                    </div>
                  ) : null}
                </div>
                <div className="practice-solution-box">
                  <button
                    className={`practice-hint-toggle ${isPracticeSolutionOpen ? 'practice-hint-toggle-open' : ''}`}
                    type="button"
                    onClick={() => setIsPracticeSolutionOpen((currentValue) => !currentValue)}
                  >
                    <span className="panel-label">Resolución paso a paso</span>
                    <strong />
                  </button>
                  {isPracticeSolutionOpen ? (
                    <div className="practice-solution-content">
                      <div className="practice-solution-step">
                        <strong>1. Datos y objetivo</strong>
                        <p>Subraya los datos del enunciado y escribe qué magnitud te piden calcular o justificar.</p>
                      </div>
                      <div className="practice-solution-step">
                        <strong>2. Fórmula guía</strong>
                        {activePracticeFormula ? (
                          <>
                            <p>{activePracticeFormula.label}</p>
                            <MathFormula latex={activePracticeFormula.latex} />
                          </>
                        ) : (
                          <p>Usa la relación principal del tema y comprueba unidades antes de sustituir.</p>
                        )}
                      </div>
                      <div className="practice-solution-step">
                        <strong>3. Planteamiento</strong>
                        <p className="practice-rich-text">{renderTextWithMath(activePracticeExercise.hint)}</p>
                      </div>
                      <div className="practice-solution-step">
                        <strong>4. Cierre</strong>
                        <p>Despeja, sustituye con unidades, revisa el signo o sentido físico y escribe una frase final con el resultado.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="practice-status-row" aria-label="Estado del ejercicio">
                  {(Object.keys(practiceStatusLabels) as PracticeStatus[]).map((status) => (
                    <button
                      key={status}
                      className={`status-chip ${activePracticeStatus === status ? `status-chip-${status}` : ''}`}
                      type="button"
                      onClick={() => setPracticeStatus(status)}
                    >
                      {practiceStatusLabels[status]}
                    </button>
                  ))}
                </div>
                {activePracticeStatus === 'fallado' || activePracticeStatus === 'revisar' ? (
                  <div className="practice-error-panel">
                    <span className="panel-label">Tipo de fallo</span>
                    <div className="practice-status-row">
                      {(Object.keys(practiceErrorTagLabels) as PracticeErrorTag[]).map((tag) => (
                        <button
                          key={tag}
                          className={`status-chip ${activePracticeErrorTags.includes(tag) ? 'status-chip-fallado' : ''}`}
                          type="button"
                          onClick={() => togglePracticeErrorTag(tag)}
                        >
                          {practiceErrorTagLabels[tag]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="practice-actions">
                  <button className="practice-button practice-button-muted" type="button" onClick={() => goToNextPrompt('prev')}>
                    Anterior
                  </button>
                  <button className="practice-button practice-button-muted" type="button" onClick={jumpToRandomPrompt}>
                    Aleatorio
                  </button>
                  <button className="practice-button" type="button" onClick={() => goToNextPrompt('next')}>
                    Siguiente
                  </button>
                </div>
              </article>

              <div className="practice-stack">
                {activePracticePdfBanks.length > 0 ? (
                  <article className="practice-card practice-side-card practice-pdf-card">
                    <span className="panel-label">Banco PAU completo</span>
                    <p className="practice-meta">
                      Aquí están los PDFs largos por años. Úsalos como banco completo mientras convertimos ejercicios a modo interactivo.
                    </p>
                    <ul className="practice-list compact-practice-list">
                      {activePracticePdfBanks.map((bank) => (
                        <li key={bank.id}>
                          <a className="practice-list-button practice-pdf-link" href={bank.url} target="_blank" rel="noreferrer">
                            <span>{bank.title}</span>
                            <small>{bank.note}</small>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ) : null}

                <article className="practice-card practice-side-card practice-bank-card">
                  <span className="panel-label">Ejercicios interactivos</span>
                  <p className="practice-meta">
                    {visiblePracticeExercises.length} visibles de {practiceExercises.length} convertidos a práctica guiada.
                  </p>
                  {practiceExercises.length <= 4 ? (
                    <div className="practice-bank-note">
                      <strong>Banco todavía corto</strong>
                      <p>Los PDFs de arriba tienen más enunciados; esta lista solo incluye los que ya están pasados a formato interactivo.</p>
                    </div>
                  ) : null}
                  <div className="status-summary-grid">
                    {(Object.keys(practiceStatusLabels) as PracticeStatus[]).map((status) => (
                      <article className={`status-summary-card status-summary-${status}`} key={status}>
                        <strong>{practiceStatusSummary[status]}</strong>
                        <span>{practiceStatusLabels[status]}</span>
                      </article>
                    ))}
                  </div>
                  <ul className="practice-list">
                    {visiblePracticeExercises.map((exercise, index) => (
                      <li key={exercise.id}>
                        <button
                          className={`practice-list-button ${index === practiceIndex ? 'practice-list-button-active' : ''}`}
                          type="button"
                          onClick={() => selectPracticeExercise(index)}
                        >
                          <span>{exercise.title}</span>
                          <small>{exercise.topicTitle} · {practicePatternByExerciseId[exercise.id] ?? practicePatternFallback} · {practiceStatuses[exercise.id] ?? 'pendiente'}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>

                {ebauSection?.bullets?.length ? (
                  <article className="practice-card practice-side-card practice-ebau-card">
                    <span className="panel-label">Cuestiones EBAU relacionadas</span>
                    <ul className="practice-list compact-practice-list">
                      {ebauSection.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ) : null}
              </div>
            </div>
          ) : (
            <article className="practice-card">
              <h3>{practiceExercises.length > 0 ? 'No hay ejercicios en esta cola' : 'Sin ejercicios cargados'}</h3>
              <p>
                {practiceExercises.length > 0
                  ? 'Cambia el filtro de cola o de patrón para volver a mostrar ejercicios.'
                  : 'Este tema aún no tiene banco EVAU propio y sigue usando solo la ficha base. Cuando añadamos más ejercicios en `content/ejercicios`, aparecerán aquí de forma automática.'}
              </p>
            </article>
          )}
        </section>
      ) : null}

      {activeView === 'simulacros' ? (
        <MockExamView
          blocks={mockExamBlocks}
          selectedBlockId={selectedMockBlockId}
          onSelectBlock={selectMockBlock}
          renderTextWithMath={renderTextWithMath}
        />
      ) : null}

      {activeView === 'simulaciones' ? (
        <section className="card simulation-viewer">
          <div className="section-heading simulation-heading">
            <div>
              <p className="eyebrow">Laboratorio interactivo</p>
              <h2>Simulaciones para manipular conceptos</h2>
            </div>
            <p className="simulation-heading-note">
              La página queda organizada como una ruta clara: eliges una simulación, manipulas
              variables, lees qué está ocurriendo y saltas al bloque real de teoría o práctica.
            </p>
          </div>

          <div className="simulation-page-flow" aria-label="Estructura de la página de simulaciones">
            <article className="simulation-flow-card">
              <span>1</span>
              <strong>Elige bloque</strong>
              <p>Tarjetas por tema con ley principal, controles y objetivo didáctico.</p>
            </article>
            <article className="simulation-flow-card">
              <span>2</span>
              <strong>Manipula variables</strong>
              <p>Controles simples con respuesta visual inmediata y valores actualizados.</p>
            </article>
            <article className="simulation-flow-card">
              <span>3</span>
              <strong>Interpreta</strong>
              <p>Lectura guiada de lo que cambia y de qué ley explica ese cambio.</p>
            </article>
            <article className="simulation-flow-card">
              <span>4</span>
              <strong>Conecta</strong>
              <p>Saltos directos a teoría, fórmulas, ejercicios o simulacros del mismo tema.</p>
            </article>
          </div>

          <div className="simulation-card-grid" aria-label="Selección de simulaciones">
            {simulationCards.map((simulation) => (
              <button
                key={simulation.id}
                className={`simulation-select-card ${selectedSimulationId === simulation.id ? 'simulation-select-card-active' : ''}`}
                type="button"
                onClick={() => setSelectedSimulationId(simulation.id)}
              >
                <div className="simulation-select-card-head">
                  <div>
                    <p className="panel-label">{simulation.kicker}</p>
                    <h3>{simulation.title}</h3>
                  </div>
                  <span className="simulation-select-symbol" aria-hidden="true">
                    {simulation.symbol}
                  </span>
                </div>
                <p>{simulation.summary}</p>
                <div className="simulation-select-meta">
                  <span>{simulation.status}</span>
                  <span>{simulation.law}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="simulation-main-layout">
            <article className="simulation-stage-card simulation-stage-featured">
              <div className="simulation-stage-head">
                <div>
                  <p className="panel-label">Simulación principal</p>
                  <h3>{selectedSimulation.title}</h3>
                </div>
                <span className="simulation-stage-law">{selectedSimulation.law}</span>
              </div>

              {selectedSimulation.id === 'ondas' ? (
                <>
                  <div className="simulation-lab-layout">
                    <div className="simulation-controls" aria-label="Controles de la simulación de ondas">
                      <label className="simulation-control">
                        <span>Amplitud A</span>
                        <strong>{formatSimulationNumber(waveAmplitude, 2)} m</strong>
                        <input
                          type="range"
                          min="0.2"
                          max="1.6"
                          step="0.05"
                          value={waveAmplitude}
                          onChange={(event) => setWaveAmplitude(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Frecuencia f</span>
                        <strong>{formatSimulationNumber(waveFrequency, 2)} Hz</strong>
                        <input
                          type="range"
                          min="0.4"
                          max="3.2"
                          step="0.05"
                          value={waveFrequency}
                          onChange={(event) => setWaveFrequency(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Velocidad v</span>
                        <strong>{formatSimulationNumber(waveSpeed, 2)} m/s</strong>
                        <input
                          type="range"
                          min="2"
                          max="16"
                          step="0.1"
                          value={waveSpeed}
                          onChange={(event) => setWaveSpeed(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Fase inicial φ</span>
                        <strong>{formatSimulationNumber(wavePhase, 2)} rad</strong>
                        <input
                          type="range"
                          min={String(-Math.PI)}
                          max={String(Math.PI)}
                          step="0.01"
                          value={wavePhase}
                          onChange={(event) => setWavePhase(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Tiempo t</span>
                        <strong>{formatSimulationNumber(waveTime, 2)} s</strong>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          step="0.02"
                          value={waveTime}
                          onChange={(event) => setWaveTime(Number(event.target.value))}
                        />
                      </label>
                      <div className="simulation-control-actions">
                        <button
                          className="practice-button"
                          type="button"
                          onClick={() => setIsWavePlaying((currentValue) => !currentValue)}
                        >
                          {isWavePlaying ? 'Pausar' : 'Reproducir'}
                        </button>
                        <button
                          className="practice-button practice-button-muted"
                          type="button"
                          onClick={() => {
                            setWaveTime(0)
                            setIsWavePlaying(false)
                          }}
                        >
                          Reiniciar
                        </button>
                      </div>
                    </div>

                    <div className="simulation-canvas-panel">
                      <div className="simulation-canvas-stage">
                        <svg viewBox="0 0 780 260" role="img" aria-label="Onda armónica en propagación">
                          <defs>
                            <linearGradient id="waveStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                              <stop offset="0%" stopColor="#ff5a7d" />
                              <stop offset="55%" stopColor="#ffd247" />
                              <stop offset="100%" stopColor="#53d2ff" />
                            </linearGradient>
                          </defs>
                          <g className="simulation-grid-lines" aria-hidden="true">
                            <line x1="0" y1="130" x2="780" y2="130" />
                            <line x1="0" y1="52" x2="780" y2="52" />
                            <line x1="0" y1="208" x2="780" y2="208" />
                            <line x1="120" y1="20" x2="120" y2="240" />
                            <line x1="390" y1="20" x2="390" y2="240" />
                            <line x1="610" y1="20" x2="610" y2="240" />
                          </g>
                          <g className="simulation-wave-guide" aria-hidden="true">
                            <line x1={waveGuide.crestStartX} y1={waveGuide.lambdaY} x2={waveGuide.crestEndX} y2={waveGuide.lambdaY} />
                            <line x1={waveGuide.crestStartX} y1={waveGuide.lambdaY - 8} x2={waveGuide.crestStartX} y2={waveGuide.lambdaY + 8} />
                            <line x1={waveGuide.crestEndX} y1={waveGuide.lambdaY - 8} x2={waveGuide.crestEndX} y2={waveGuide.lambdaY + 8} />
                            <text x={waveGuide.crestLabelX} y={waveGuide.lambdaY - 10}>λ</text>
                            <circle cx={waveGuide.crestStartX} cy={waveGuide.crestY} r="6" />
                            <circle cx={waveGuide.crestEndX} cy={waveGuide.crestY} r="6" />
                          </g>
                          <polyline className="simulation-wave-line" points={wavePath} />
                          <line className="simulation-probe-line" x1="610" y1="20" x2="610" y2="240" />
                          <circle className="simulation-probe-dot" cx="610" cy={waveProbeY} r="8" />
                        </svg>
                      </div>
                      <div className="simulation-readout-row">
                        <div className="simulation-live-readout">
                          <article>
                            <span>Longitud de onda</span>
                            <strong>{formatSimulationNumber(waveWavelength, 2)} m</strong>
                          </article>
                          <article>
                            <span>Período</span>
                            <strong>{formatSimulationNumber(wavePeriod, 2)} s</strong>
                          </article>
                          <article>
                            <span>y(6,t)</span>
                            <strong>{formatSimulationNumber(waveProbeDisplacement, 2)} m</strong>
                          </article>
                          <article>
                            <span>vibración local</span>
                            <strong>{formatSimulationNumber(waveProbeVelocity, 2)} m/s</strong>
                          </article>
                        </div>
                        <div className="simulation-equation-card">
                          <strong className="simulation-equation-title">Ecuación instantánea</strong>
                          <MathFormula latex={waveEquationLatex} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="simulation-interpret-grid">
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Qué estás viendo</span>
                      <p>
                        Si subes la frecuencia con la velocidad fija, la onda mete más oscilaciones en el
                        mismo espacio y la longitud de onda disminuye. Si subes la velocidad con la frecuencia
                        fija, la separación entre crestas crece.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Lectura para examen</span>
                      <p>
                        Esta simulación traduce directamente la relación entre gráfica, ecuación y magnitudes
                        básicas que luego aparecen en problemas de ondas armónicas y sonido.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Clave conceptual</span>
                      <p>
                        La onda se propaga con velocidad {formatSimulationNumber(waveSpeed, 2)} m/s, pero la
                        partícula del medio en la sonda sube y baja con una velocidad de vibración distinta.
                        Ese contraste ayuda a no confundir propagación con movimiento local.
                      </p>
                    </article>
                  </div>

                  <div className="practice-actions simulation-link-actions">
                    <button className="practice-button" type="button" onClick={() => openStudyFromSimulation('01-ondas', 'teoria')}>
                      Ver teoría
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openStudyFromSimulation('01-ondas', 'formulas')}>
                      Ver fórmulas
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openPracticeFromSimulation('01-ondas')}>
                      Ir a ejercicios
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openMockFromSimulation('01-ondas')}>
                      Ir a simulacro
                    </button>
                  </div>
                </>
              ) : selectedSimulation.id === 'optica' ? (
                <>
                  <div className="simulation-lab-layout">
                    <div className="simulation-controls" aria-label="Controles de la simulación de lentes">
                      <div className="simulation-control">
                        <span>Tipo de lente</span>
                        <div className="simulation-toggle-row" role="group" aria-label="Seleccionar tipo de lente">
                          <button
                            className={`simulation-toggle-button ${lensType === 'convergente' ? 'simulation-toggle-button-active' : ''}`}
                            type="button"
                            onClick={() => setLensType('convergente')}
                          >
                            Convergente
                          </button>
                          <button
                            className={`simulation-toggle-button ${lensType === 'divergente' ? 'simulation-toggle-button-active' : ''}`}
                            type="button"
                            onClick={() => setLensType('divergente')}
                          >
                            Divergente
                          </button>
                        </div>
                      </div>
                      <label className="simulation-control">
                        <span>Distancia focal |f|</span>
                        <strong>{formatSimulationNumber(lensFocalLength, 2)} m</strong>
                        <input
                          type="range"
                          min="0.8"
                          max="4.6"
                          step="0.1"
                          value={lensFocalLength}
                          onChange={(event) => setLensFocalLength(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Posición del objeto s</span>
                        <strong>{formatSimulationNumber(lensObjectDistance, 2)} m</strong>
                        <input
                          type="range"
                          min="1.2"
                          max="8.8"
                          step="0.1"
                          value={lensObjectDistance}
                          onChange={(event) => setLensObjectDistance(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Altura del objeto y</span>
                        <strong>{formatSimulationNumber(lensObjectHeight, 2)} m</strong>
                        <input
                          type="range"
                          min="0.5"
                          max="2.4"
                          step="0.05"
                          value={lensObjectHeight}
                          onChange={(event) => setLensObjectHeight(Number(event.target.value))}
                        />
                      </label>
                    </div>

                    <div className="simulation-canvas-panel">
                      <div className="simulation-canvas-stage simulation-optics-stage">
                        <svg viewBox={`0 0 ${lensScene.width} ${lensScene.height}`} aria-label="Formación de imagen en una lente delgada">
                          <defs>
                            <marker id="rayArrowParallel" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#ffd247" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="rayArrowCentral" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#ff8dc3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="rayArrowFocus" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#53d2ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="rayArrowGhost" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="rgba(173, 224, 255, 0.72)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                          </defs>
                          <g className="simulation-grid-lines" aria-hidden="true">
                            <line className="simulation-optical-axis" x1="0" y1={lensScene.axisY} x2={lensScene.width} y2={lensScene.axisY} />
                          </g>
                          <g className="simulation-optics-focuses" aria-hidden="true">
                            <line x1={lensScene.leftFocusX} y1={lensScene.axisY - 12} x2={lensScene.leftFocusX} y2={lensScene.axisY + 12} />
                            <line x1={lensScene.rightFocusX} y1={lensScene.axisY - 12} x2={lensScene.rightFocusX} y2={lensScene.axisY + 12} />
                            <line x1={lensScene.leftDoubleFocusX} y1={lensScene.axisY - 9} x2={lensScene.leftDoubleFocusX} y2={lensScene.axisY + 9} />
                            <line x1={lensScene.rightDoubleFocusX} y1={lensScene.axisY - 9} x2={lensScene.rightDoubleFocusX} y2={lensScene.axisY + 9} />
                            <text x={lensScene.leftFocusX} y={lensScene.axisY + 30}>F</text>
                            <text x={lensScene.rightFocusX} y={lensScene.axisY + 30}>F'</text>
                            <text x={lensScene.leftDoubleFocusX} y={lensScene.axisY + 28}>2F</text>
                            <text x={lensScene.rightDoubleFocusX} y={lensScene.axisY + 28}>2F'</text>
                          </g>
                          <g className={`simulation-optics-lens simulation-optics-lens-${lensType}`} aria-hidden="true">
                            {lensType === 'convergente' ? (
                              <path
                                d={
                                  `M ${lensScene.lensX} 30 ` +
                                  `C ${lensScene.lensX - 15} 62 ${lensScene.lensX - 24} 104 ${lensScene.lensX - 21} ${lensScene.axisY} ` +
                                  `C ${lensScene.lensX - 24} ${lensScene.height - 104} ${lensScene.lensX - 15} ${lensScene.height - 62} ${lensScene.lensX} ${lensScene.height - 30} ` +
                                  `C ${lensScene.lensX + 15} ${lensScene.height - 62} ${lensScene.lensX + 24} ${lensScene.height - 104} ${lensScene.lensX + 21} ${lensScene.axisY} ` +
                                  `C ${lensScene.lensX + 24} 104 ${lensScene.lensX + 15} 62 ${lensScene.lensX} 30 Z`
                                }
                              />
                            ) : (
                              <path
                                d={
                                  `M ${lensScene.lensX - 18} 30 ` +
                                  `L ${lensScene.lensX + 18} 30 ` +
                                  `C ${lensScene.lensX + 8} 66 ${lensScene.lensX + 6} 110 ${lensScene.lensX + 8} ${lensScene.axisY} ` +
                                  `C ${lensScene.lensX + 6} ${lensScene.height - 110} ${lensScene.lensX + 8} ${lensScene.height - 66} ${lensScene.lensX + 18} ${lensScene.height - 30} ` +
                                  `L ${lensScene.lensX - 18} ${lensScene.height - 30} ` +
                                  `C ${lensScene.lensX - 8} ${lensScene.height - 66} ${lensScene.lensX - 6} ${lensScene.height - 110} ${lensScene.lensX - 8} ${lensScene.axisY} ` +
                                  `C ${lensScene.lensX - 6} 110 ${lensScene.lensX - 8} 66 ${lensScene.lensX - 18} 30 Z`
                                }
                              />
                            )}
                          </g>
                          <g className="simulation-optics-object" aria-hidden="true">
                            <line x1={lensScene.objectX} y1={lensScene.axisY} x2={lensScene.objectX} y2={lensScene.objectTipY} />
                            <path d={`M ${lensScene.objectX - 8} ${lensScene.objectTipY + 14} L ${lensScene.objectX} ${lensScene.objectTipY} L ${lensScene.objectX + 8} ${lensScene.objectTipY + 14}`} />
                            <text x={lensScene.objectX} y={lensScene.axisY + 24}>s</text>
                          </g>
                          <g className={`simulation-optics-image ${lensImageNature === 'virtual' ? 'simulation-optics-image-virtual' : ''}`} aria-hidden="true">
                            {!lensImageAtInfinity ? (
                              <>
                                <line x1={lensScene.imageX} y1={lensScene.axisY} x2={lensScene.imageX} y2={lensScene.imageTipY} />
                                <path d={`M ${lensScene.imageX - 8} ${lensScene.imageTipY + (lensScene.imageTipY <= lensScene.axisY ? 14 : -14)} L ${lensScene.imageX} ${lensScene.imageTipY} L ${lensScene.imageX + 8} ${lensScene.imageTipY + (lensScene.imageTipY <= lensScene.axisY ? 14 : -14)}`} />
                                <text x={lensScene.imageX} y={lensScene.axisY + 24}>s'</text>
                              </>
                            ) : null}
                          </g>
                          <g className="simulation-optics-rays" aria-hidden="true">
                            <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={lensScene.objectX} y1={lensScene.objectTipY} x2={lensScene.lensX} y2={lensScene.objectTipY} />
                            {lensImageAtInfinity ? (
                              <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={lensScene.lensX} y1={lensScene.objectTipY} x2={lensScene.rightBound} y2={lensScene.objectTipY} />
                            ) : lensImageDistance > 0 ? (
                              <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={lensScene.lensX} y1={lensScene.objectTipY} x2={lensScene.imageX} y2={lensScene.imageTipY} />
                            ) : (
                              <>
                                <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={lensScene.lensX} y1={lensScene.objectTipY} x2={lensScene.rightBound} y2={lensScene.virtualParallelExitY} />
                                <line className="simulation-optics-ray-ghost" x1={lensScene.lensX} y1={lensScene.objectTipY} x2={lensScene.imageX} y2={lensScene.imageTipY} />
                              </>
                            )}
                            <line className="simulation-optics-ray simulation-optics-ray-central" x1={lensScene.objectX} y1={lensScene.objectTipY} x2={lensScene.lensX} y2={lensScene.axisY} />
                            <line className="simulation-optics-ray simulation-optics-ray-central" x1={lensScene.lensX} y1={lensScene.axisY} x2={lensScene.rightBound} y2={lensScene.centralRayExitY} />
                            {lensScene.shouldBacktraceToImage ? (
                              <line className="simulation-optics-ray-ghost" x1={lensScene.lensX} y1={lensScene.axisY} x2={lensScene.imageX} y2={lensScene.virtualCenterBacktraceY} />
                            ) : null}
                            <line className="simulation-optics-ray simulation-optics-ray-focus" x1={lensScene.objectX} y1={lensScene.objectTipY} x2={lensScene.lensX} y2={lensScene.focusRayEntryY} />
                            <line className="simulation-optics-ray simulation-optics-ray-focus" x1={lensScene.lensX} y1={lensScene.focusRayEntryY} x2={lensScene.rightBound} y2={lensScene.focusRayEntryY} />
                          </g>
                        </svg>
                      </div>

                      <div className="simulation-readout-row">
                        <div className="simulation-live-readout">
                          <article>
                            <span>Distancia imagen s'</span>
                            <strong>{lensImageAtInfinity ? '∞' : `${formatSimulationNumber(Math.abs(lensImageDistance), 2)} m`}</strong>
                          </article>
                          <article>
                            <span>Aumento M</span>
                            <strong>{lensImageAtInfinity ? '∞' : formatSimulationNumber(lensMagnification, 2)}</strong>
                          </article>
                          <article>
                            <span>Altura imagen y'</span>
                            <strong>{lensImageAtInfinity ? '∞' : `${formatSimulationNumber(Math.abs(lensImageHeight), 2)} m`}</strong>
                          </article>
                          <article>
                            <span>Tipo de imagen</span>
                            <strong>{lensImageNature === 'impropia' ? 'impropia' : `${lensImageNature} · ${lensImageOrientation}`}</strong>
                          </article>
                        </div>
                        <div className="simulation-equation-card">
                          <strong className="simulation-equation-title">Ecuación de lentes</strong>
                          <MathFormula latex={lensEquationLatex} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="simulation-interpret-grid">
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Qué estás viendo</span>
                      <p>
                        El objeto está {lensObjectRegion}. Al moverlo, la imagen cambia de lado, tamaño y
                        orientación sin salirte de la misma ley de lentes delgadas.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Lectura para examen</span>
                      <p>
                        Si la imagen sale real, queda al otro lado de la lente y puede proyectarse. Si sale
                        virtual, aparece en el mismo lado del objeto y no se proyecta en pantalla.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Clave conceptual</span>
                      <p>
                        Una lente {lensType} con foco {lensType === 'convergente' ? 'positivo' : 'negativo'}
                        {' '}no obliga a memorizar casos: basta leer el signo de {`s'`} y el aumento para saber
                        si la imagen es real o virtual, derecha o invertida.
                      </p>
                    </article>
                  </div>

                  <div className="practice-actions simulation-link-actions">
                    <button className="practice-button" type="button" onClick={() => openStudyFromSimulation('09-optica-geometrica', 'teoria')}>
                      Ver teoría
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openStudyFromSimulation('09-optica-geometrica', 'formulas')}>
                      Ver fórmulas
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openPracticeFromSimulation('09-optica-geometrica')}>
                      Ir a ejercicios
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openMockFromSimulation('09-optica-geometrica')}>
                      Ir a simulacro
                    </button>
                  </div>
                </>
              ) : selectedSimulation.id === 'espejos' ? (
                <>
                  <div className="simulation-lab-layout">
                    <div className="simulation-controls" aria-label="Controles de la simulación de espejos">
                      <div className="simulation-control">
                        <span>Tipo de espejo</span>
                        <div className="simulation-toggle-row" role="group" aria-label="Seleccionar tipo de espejo">
                          <button
                            className={`simulation-toggle-button ${mirrorType === 'concavo' ? 'simulation-toggle-button-active' : ''}`}
                            type="button"
                            onClick={() => setMirrorType('concavo')}
                          >
                            Cóncavo
                          </button>
                          <button
                            className={`simulation-toggle-button ${mirrorType === 'convexo' ? 'simulation-toggle-button-active' : ''}`}
                            type="button"
                            onClick={() => setMirrorType('convexo')}
                          >
                            Convexo
                          </button>
                        </div>
                      </div>
                      <label className="simulation-control">
                        <span>Distancia focal |f|</span>
                        <strong>{formatSimulationNumber(mirrorFocalLength, 2)} m</strong>
                        <input
                          type="range"
                          min="0.6"
                          max="2.8"
                          step="0.1"
                          value={mirrorFocalLength}
                          onChange={(event) => setMirrorFocalLength(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Posición del objeto s</span>
                        <strong>{formatSimulationNumber(mirrorObjectDistance, 2)} m</strong>
                        <input
                          type="range"
                          min="0.8"
                          max="8.6"
                          step="0.1"
                          value={mirrorObjectDistance}
                          onChange={(event) => setMirrorObjectDistance(Number(event.target.value))}
                        />
                      </label>
                      <label className="simulation-control">
                        <span>Altura del objeto y</span>
                        <strong>{formatSimulationNumber(mirrorObjectHeight, 2)} m</strong>
                        <input
                          type="range"
                          min="0.5"
                          max="2.4"
                          step="0.05"
                          value={mirrorObjectHeight}
                          onChange={(event) => setMirrorObjectHeight(Number(event.target.value))}
                        />
                      </label>
                    </div>

                    <div className="simulation-canvas-panel">
                      <div className="simulation-canvas-stage simulation-optics-stage">
                        <svg viewBox={`0 0 ${mirrorScene.width} ${mirrorScene.height}`} aria-label="Formación de imagen en un espejo esférico">
                          <defs>
                            <marker id="mirrorArrowParallel" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#ffd247" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="mirrorArrowCenter" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#ff8dc3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="mirrorArrowFocus" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#53d2ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                            <marker id="mirrorArrowGhost" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                              <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="rgba(173, 224, 255, 0.72)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                          </defs>
                          <g className="simulation-grid-lines" aria-hidden="true">
                            <line className="simulation-optical-axis" x1="0" y1={mirrorScene.axisY} x2={mirrorScene.width} y2={mirrorScene.axisY} />
                          </g>
                          <g className="simulation-optics-focuses" aria-hidden="true">
                            <line x1={mirrorScene.focusX} y1={mirrorScene.axisY - 12} x2={mirrorScene.focusX} y2={mirrorScene.axisY + 12} />
                            <line x1={mirrorScene.centerX} y1={mirrorScene.axisY - 9} x2={mirrorScene.centerX} y2={mirrorScene.axisY + 9} />
                            <line x1={mirrorScene.mirrorX} y1={mirrorScene.axisY - 10} x2={mirrorScene.mirrorX} y2={mirrorScene.axisY + 10} />
                            <text x={mirrorScene.centerX} y={mirrorScene.axisY + 28}>C</text>
                            <text x={mirrorScene.focusX} y={mirrorScene.axisY + 30}>F</text>
                            <text x={mirrorScene.mirrorX} y={mirrorScene.axisY + 30}>V</text>
                          </g>
                          <g className={`simulation-mirror-body simulation-mirror-body-${mirrorType}`} aria-hidden="true">
                            {mirrorType === 'concavo' ? (
                              <path
                                d={
                                  `M ${mirrorScene.mirrorX - 18} 34 ` +
                                  `Q ${mirrorScene.mirrorX + 18} ${mirrorScene.axisY} ${mirrorScene.mirrorX - 18} ${mirrorScene.height - 34}`
                                }
                              />
                            ) : (
                              <path
                                d={
                                  `M ${mirrorScene.mirrorX + 10} 34 ` +
                                  `Q ${mirrorScene.mirrorX - 30} ${mirrorScene.axisY} ${mirrorScene.mirrorX + 10} ${mirrorScene.height - 34}`
                                }
                              />
                            )}
                          </g>
                          <g className="simulation-optics-object" aria-hidden="true">
                            <line x1={mirrorScene.objectX} y1={mirrorScene.axisY} x2={mirrorScene.objectX} y2={mirrorScene.objectTipY} />
                            <path d={`M ${mirrorScene.objectX - 8} ${mirrorScene.objectTipY + 14} L ${mirrorScene.objectX} ${mirrorScene.objectTipY} L ${mirrorScene.objectX + 8} ${mirrorScene.objectTipY + 14}`} />
                            <text x={mirrorScene.objectX} y={mirrorScene.axisY + 24}>s</text>
                          </g>
                          <g className={`simulation-optics-image ${mirrorImageNature === 'virtual' ? 'simulation-optics-image-virtual' : ''}`} aria-hidden="true">
                            {!mirrorImageAtInfinity ? (
                              <>
                                <line x1={mirrorScene.imageX} y1={mirrorScene.axisY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                                <path d={`M ${mirrorScene.imageX - 8} ${mirrorScene.imageTipY + (mirrorScene.imageTipY <= mirrorScene.axisY ? 14 : -14)} L ${mirrorScene.imageX} ${mirrorScene.imageTipY} L ${mirrorScene.imageX + 8} ${mirrorScene.imageTipY + (mirrorScene.imageTipY <= mirrorScene.axisY ? 14 : -14)}`} />
                                <text x={mirrorScene.imageX} y={mirrorScene.axisY + 24}>s'</text>
                              </>
                            ) : null}
                          </g>
                          <g className="simulation-optics-rays" aria-hidden="true">
                            <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={mirrorScene.objectX} y1={mirrorScene.objectTipY} x2={mirrorScene.mirrorX} y2={mirrorScene.objectTipY} />
                            {mirrorImageAtInfinity ? (
                              <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={mirrorScene.mirrorX} y1={mirrorScene.objectTipY} x2={mirrorScene.leftBound} y2={mirrorScene.parallelRayLeftY} />
                            ) : mirrorImageDistance > 0 ? (
                              <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={mirrorScene.mirrorX} y1={mirrorScene.objectTipY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                            ) : (
                              <>
                                <line className="simulation-optics-ray simulation-optics-ray-parallel" x1={mirrorScene.mirrorX} y1={mirrorScene.objectTipY} x2={mirrorScene.leftBound} y2={mirrorScene.parallelRayLeftY} />
                                <line className="simulation-optics-ray-ghost" x1={mirrorScene.mirrorX} y1={mirrorScene.objectTipY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                              </>
                            )}
                            <line className="simulation-optics-ray simulation-optics-ray-focus" x1={mirrorScene.objectX} y1={mirrorScene.objectTipY} x2={mirrorScene.mirrorX} y2={mirrorScene.focusRayHitY} />
                            {mirrorImageAtInfinity ? (
                              <line className="simulation-optics-ray simulation-optics-ray-focus" x1={mirrorScene.mirrorX} y1={mirrorScene.focusRayHitY} x2={mirrorScene.leftBound} y2={mirrorScene.focusRayHitY} />
                            ) : mirrorImageDistance > 0 ? (
                              <line className="simulation-optics-ray simulation-optics-ray-focus" x1={mirrorScene.mirrorX} y1={mirrorScene.focusRayHitY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                            ) : (
                              <>
                                <line className="simulation-optics-ray simulation-optics-ray-focus" x1={mirrorScene.mirrorX} y1={mirrorScene.focusRayHitY} x2={mirrorScene.leftBound} y2={mirrorScene.focusRayHitY} />
                                <line className="simulation-optics-ray-ghost" x1={mirrorScene.mirrorX} y1={mirrorScene.focusRayHitY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                              </>
                            )}
                            <line className="simulation-optics-ray simulation-optics-ray-central" x1={mirrorScene.objectX} y1={mirrorScene.objectTipY} x2={mirrorScene.mirrorX} y2={mirrorScene.centerRayHitY} />
                            {mirrorImageAtInfinity ? (
                              <line className="simulation-optics-ray simulation-optics-ray-central" x1={mirrorScene.mirrorX} y1={mirrorScene.centerRayHitY} x2={mirrorScene.leftBound} y2={mirrorScene.centerRayLeftY} />
                            ) : mirrorImageDistance > 0 ? (
                              <line className="simulation-optics-ray simulation-optics-ray-central" x1={mirrorScene.mirrorX} y1={mirrorScene.centerRayHitY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                            ) : (
                              <>
                                <line className="simulation-optics-ray simulation-optics-ray-central" x1={mirrorScene.mirrorX} y1={mirrorScene.centerRayHitY} x2={mirrorScene.leftBound} y2={mirrorScene.centerRayLeftY} />
                                <line className="simulation-optics-ray-ghost" x1={mirrorScene.mirrorX} y1={mirrorScene.centerRayHitY} x2={mirrorScene.imageX} y2={mirrorScene.imageTipY} />
                              </>
                            )}
                          </g>
                        </svg>
                      </div>

                      <div className="simulation-readout-row">
                        <div className="simulation-live-readout">
                          <article>
                            <span>Distancia imagen s'</span>
                            <strong>{mirrorImageAtInfinity ? '∞' : `${formatSimulationNumber(Math.abs(mirrorImageDistance), 2)} m`}</strong>
                          </article>
                          <article>
                            <span>Aumento M</span>
                            <strong>{mirrorImageAtInfinity ? '∞' : formatSimulationNumber(mirrorMagnification, 2)}</strong>
                          </article>
                          <article>
                            <span>Altura imagen y'</span>
                            <strong>{mirrorImageAtInfinity ? '∞' : `${formatSimulationNumber(Math.abs(mirrorImageHeight), 2)} m`}</strong>
                          </article>
                          <article>
                            <span>Tipo de imagen</span>
                            <strong>{mirrorImageNature === 'impropia' ? 'impropia' : `${mirrorImageNature} · ${mirrorImageOrientation}`}</strong>
                          </article>
                        </div>
                        <div className="simulation-equation-card">
                          <strong className="simulation-equation-title">Ecuación de espejos</strong>
                          <MathFormula latex={mirrorEquationLatex} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="simulation-interpret-grid">
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Qué estás viendo</span>
                      <p>
                        El objeto está {mirrorObjectRegion}. Al moverlo, la imagen cambia de posición,
                        tamaño y orientación siguiendo la construcción típica con F, C y V.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Lectura para examen</span>
                      <p>
                        En el espejo cóncavo la imagen puede ser real o virtual según dónde pongas el
                        objeto respecto a F. En el convexo sale siempre virtual, derecha y menor.
                      </p>
                    </article>
                    <article className="simulation-interpret-card">
                      <span className="panel-label">Clave conceptual</span>
                      <p>
                        No hace falta memorizar dibujos aislados: con el signo de {`f`} y de {`s'`}, más
                        el aumento, puedes decidir inmediatamente si la imagen se proyecta, se invierte o se reduce.
                      </p>
                    </article>
                  </div>

                  <div className="practice-actions simulation-link-actions">
                    <button className="practice-button" type="button" onClick={() => openStudyFromSimulation('09-optica-geometrica', 'teoria')}>
                      Ver teoría
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openStudyFromSimulation('09-optica-geometrica', 'formulas')}>
                      Ver fórmulas
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openPracticeFromSimulation('09-optica-geometrica')}>
                      Ir a ejercicios
                    </button>
                    <button className="practice-button practice-button-muted" type="button" onClick={() => openMockFromSimulation('09-optica-geometrica')}>
                      Ir a simulacro
                    </button>
                  </div>
                </>
              ) : null}
            </article>
          </div>

          <article className="simulation-stage-card simulation-takeaways-card">
            <span className="panel-label">Qué debe aprender el alumno</span>
            <ul className="simulation-bullet-list">
              {selectedSimulation.takeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </article>

          <div className="practice-actions simulation-link-actions">
            <button className="practice-button practice-button-muted" type="button" onClick={() => setActiveView('ampliacion')}>
              Ver recursos PhET
            </button>
          </div>
        </section>
      ) : null}

      {activeView === 'ampliacion' ? (
        <section className="card phet-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recursos externos</p>
              <h2>PhET para profundizar sin recargar la app</h2>
            </div>
            <p className="simulation-heading-note">
              Aquí quedan los recursos externos para explorar más temas o versiones más completas de un
              fenómeno, sin mezclar esa complejidad dentro del laboratorio principal de la app.
            </p>
          </div>

          <div className="phet-intro-grid">
            <article className="simulation-flow-card">
              <span>1</span>
              <strong>Consolida aquí</strong>
              <p>Usa primero las simulaciones propias de ondas, lentes y espejos para fijar la idea base.</p>
            </article>
            <article className="simulation-flow-card">
              <span>2</span>
              <strong>Amplía con PhET</strong>
              <p>Abre la simulación externa cuando quieras más casos, más controles o más profundidad visual.</p>
            </article>
            <article className="simulation-flow-card">
              <span>3</span>
              <strong>Vuelve al temario</strong>
              <p>Cierra el bucle enlazando teoría, fórmulas y ejercicios del mismo bloque del curso.</p>
            </article>
          </div>

          <div className="phet-group-list" aria-label="Recursos de ampliación con PhET por bloques">
            {phetResourceGroups.map(({ group, resources }) => (
              <details className={`phet-group-section ${phetGroupMeta[group].accentClassName}`} key={group} open={activePhetGroup === group}>
                <summary
                  className="phet-group-summary"
                  onClick={(event) => {
                    event.preventDefault()
                    setActivePhetGroup(group)
                  }}
                >
                  <div className="phet-group-summary-main">
                    <span className="phet-group-icon" aria-hidden="true">
                      {phetGroupMeta[group].icon}
                    </span>
                    <div className="phet-group-heading">
                      <p className="panel-label">Bloque</p>
                      <h3>{group}</h3>
                      <p className="phet-group-description">{phetGroupMeta[group].description}</p>
                    </div>
                  </div>
                  <div className="phet-group-summary-side">
                    <span className="phet-group-count">{resources.length} simulaciones</span>
                    <span className="phet-group-chevron" aria-hidden="true">⌄</span>
                  </div>
                </summary>
                <div className="phet-resource-grid">
                  {resources.map((resource) => (
                    <article className="phet-resource-card" key={resource.title}>
                      <div className="simulation-select-card-head">
                        <div>
                          <p className="panel-label">{resource.topicLabel}</p>
                          <h3>{resource.title}</h3>
                        </div>
                      </div>
                      <p>{resource.focus}</p>
                      <ul className="simulation-bullet-list">
                        {resource.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                      <div className="practice-actions phet-link-actions">
                        <a className="practice-button" href={resource.url} target="_blank" rel="noreferrer">
                          Abrir en PhET
                        </a>
                        <button className="practice-button practice-button-muted" type="button" onClick={() => openStudyFromSimulation(resource.topicId, 'teoria')}>
                          Ver teoría
                        </button>
                        <button className="practice-button practice-button-muted" type="button" onClick={() => openPracticeFromSimulation(resource.topicId)}>
                          Ir a ejercicios
                        </button>
                        {'nativeSimulationId' in resource ? (
                          <button className="practice-button practice-button-muted" type="button" onClick={() => openNativeSimulation(resource.nativeSimulationId)}>
                            Comparar con simulación propia
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

    </main>
  )
}

export default App
