import { useEffect, useMemo, useState, type ReactNode } from 'react'
import MathFormula from './MathFormula'
import { exerciseSheetById, type ExerciseEntry } from '../data/exerciseSheets'
import { formulaSheets } from '../data/formulaSheets'
import { studyModules } from '../data/studyPlan'

export type MockExamBlock = {
  id: string
  title: string
  description: string
  sections: MockExamSyllabusBlock[]
  obligatorySectionId: string
}

export type MockExamSyllabusBlock = {
  id: string
  title: string
  topicIds: string[]
}

type MockExamExercise = ExerciseEntry & {
  topicId: string
  topicTitle: string
}

type MockExamOption = {
  id: string
  label: string
  latex: string
}

type MockExamQuestion = {
  exerciseId: string
  mode: 'formula' | 'numeric'
  prompt: string
  options: MockExamOption[]
  correctOptionId: string
  correctLabel: string
  correctLatex: string
  successMessage: string
  failureMessage: string
}

type MockExamSection = {
  blockId: string
  topicTitle: string
  exercises: MockExamExercise[]
  points: number
}

type MockExam = {
  obligatory: MockExamSection
  optionals: MockExamSection[]
}

const mockExamSectionPoints = [2, 2, 3, 3] as const
const examDurationOptions = [90, 60, 45, 30] as const
const defaultExamDurationMinutes = 90

type MockExamViewProps = {
  blocks: MockExamBlock[]
  selectedBlockId: string
  onSelectBlock: (blockId: string) => void
  renderTextWithMath: (text: string) => ReactNode
}

const allMockExamFormulaChoices = formulaSheets.flatMap((sheet) =>
  sheet.formulas.map((formula, index) => ({
    id: `${sheet.id}-${index}`,
    label: formula.label,
    latex: formula.latex,
    topicId: sheet.id,
  })),
)

const numericMockExamQuestionByExerciseId: Record<string, Omit<MockExamQuestion, 'exerciseId'>> = {
  '01-ondas-onda-armonica-de-una-ballena-azul': {
    mode: 'numeric',
    prompt: '¿Qué valor numérico obtienes para la longitud de onda inicial `\\lambda` antes de escribir la función de onda?',
    options: [
      { id: 'a', label: '', latex: '60\\,\\mathrm{m}' },
      { id: 'b', label: '', latex: '37.5\\,\\mathrm{m}' },
      { id: 'c', label: '', latex: '1500\\,\\mathrm{m}' },
      { id: 'd', label: '', latex: '0.0167\\,\\mathrm{m}' },
    ],
    correctOptionId: 'a',
    correctLabel: 'Longitud de onda correcta',
    correctLatex: '60\\,\\mathrm{m}',
    successMessage: 'Has elegido el resultado numérico correcto para la longitud de onda.',
    failureMessage: 'El valor correcto de la longitud de onda para arrancar el ejercicio era este:',
  },
  '03-gravitacion-periodo-orbital-de-urano': {
    mode: 'numeric',
    prompt: '¿Qué período orbital aproximado obtiene Urano al compararlo con la órbita terrestre mediante la tercera ley de Kepler?',
    options: [
      { id: 'a', label: '', latex: '19.3\\,\\text{años}' },
      { id: 'b', label: '', latex: '84.9\\,\\text{años}' },
      { id: 'c', label: '', latex: '164.8\\,\\text{años}' },
      { id: 'd', label: '', latex: '42.4\\,\\text{años}' },
    ],
    correctOptionId: 'b',
    correctLabel: 'Período orbital correcto',
    correctLatex: '84.9\\,\\text{años}',
    successMessage: 'Has elegido el período orbital correcto para Urano.',
    failureMessage: 'El período orbital aproximado que sale de la comparación es este:',
  },
  '04-campo-electrico-campo-total-de-dos-cargas-puntuales': {
    mode: 'numeric',
    prompt: '¿En qué posición `x > 1\\,\\mathrm{m}` se anula el campo eléctrico total sobre el eje X para estas dos cargas?',
    options: [
      { id: 'a', label: '', latex: '2.41\\,\\mathrm{m}' },
      { id: 'b', label: '', latex: '3.41\\,\\mathrm{m}' },
      { id: 'c', label: '', latex: '1.71\\,\\mathrm{m}' },
      { id: 'd', label: '', latex: '4.00\\,\\mathrm{m}' },
    ],
    correctOptionId: 'b',
    correctLabel: 'Punto de anulación correcto',
    correctLatex: '3.41\\,\\mathrm{m}',
    successMessage: 'Has elegido el punto correcto donde el campo total se anula.',
    failureMessage: 'El punto correcto donde se anula el campo total es este:',
  },
  '08-optica-fisica-fibra-de-cuarzo-y-angulo-limite': {
    mode: 'numeric',
    prompt: '¿Qué índice de refracción `n` se obtiene para el cuarzo si el ángulo límite es `41.8^\\circ` y `n_{aire}=1`?',
    options: [
      { id: 'a', label: '', latex: '1.12' },
      { id: 'b', label: '', latex: '1.34' },
      { id: 'c', label: '', latex: '1.50' },
      { id: 'd', label: '', latex: '1.79' },
    ],
    correctOptionId: 'c',
    correctLabel: 'Índice de refracción correcto',
    correctLatex: '1.50',
    successMessage: 'Has elegido el índice de refracción correcto para el cuarzo.',
    failureMessage: 'El índice de refracción correcto del cuarzo es este:',
  },
  '10-relatividad-especial-neutron-con-energia-cinetica-relativista': {
    mode: 'numeric',
    prompt: '¿Qué valor aproximado toma el cociente `E_{total}/E_0` para un neutrón con `E_c=50\\,\\mathrm{MeV}` y `E_0=940\\,\\mathrm{MeV}`?',
    options: [
      { id: 'a', label: '', latex: '1.053' },
      { id: 'b', label: '', latex: '1.500' },
      { id: 'c', label: '', latex: '0.947' },
      { id: 'd', label: '', latex: '1.103' },
    ],
    correctOptionId: 'a',
    correctLabel: 'Cociente energético correcto',
    correctLatex: '1.053',
    successMessage: 'Has elegido el cociente energético relativista correcto.',
    failureMessage: 'El cociente correcto entre energía total y energía en reposo es este:',
  },
  '11-fisica-cuantica-frecuencia-umbral-y-potencial-de-frenado': {
    mode: 'numeric',
    prompt: '¿Qué frecuencia umbral `f_0` corresponde a una longitud de onda umbral de `540\\,\\mathrm{nm}`?',
    options: [
      { id: 'a', label: '', latex: '3.00\\times10^8\\,\\mathrm{Hz}' },
      { id: 'b', label: '', latex: '5.56\\times10^{14}\\,\\mathrm{Hz}' },
      { id: 'c', label: '', latex: '1.85\\times10^{15}\\,\\mathrm{Hz}' },
      { id: 'd', label: '', latex: '5.40\\times10^{14}\\,\\mathrm{Hz}' },
    ],
    correctOptionId: 'b',
    correctLabel: 'Frecuencia umbral correcta',
    correctLatex: '5.56\\times10^{14}\\,\\mathrm{Hz}',
    successMessage: 'Has elegido la frecuencia umbral correcta.',
    failureMessage: 'La frecuencia umbral correcta es esta:',
  },
  '12-fisica-nuclear-cadena-alfa-beta-a-partir-del-radon-222': {
    mode: 'numeric',
    prompt: 'Tras una emisión `\\alpha` y luego una `\\beta^{-}` desde `Rn\\text{-}222`, ¿qué número atómico final `Z` obtiene el núcleo hijo?',
    options: [
      { id: 'a', label: '', latex: '84' },
      { id: 'b', label: '', latex: '85' },
      { id: 'c', label: '', latex: '86' },
      { id: 'd', label: '', latex: '87' },
    ],
    correctOptionId: 'b',
    correctLabel: 'Número atómico final correcto',
    correctLatex: '85',
    successMessage: 'Has elegido el número atómico final correcto.',
    failureMessage: 'El número atómico final correcto es este:',
  },
}

function normalizePhysicsFormulaText(text: string) {
  return text
    .toLowerCase()
    .replace(/\\lambda|λ/g, ' lambda ')
    .replace(/\\omega|ω/g, ' omega ')
    .replace(/\\varphi|\\phi|φ/g, ' phi ')
    .replace(/\\delta|\\Delta|Δ/g, ' delta ')
    .replace(/\\gamma|γ/g, ' gamma ')
    .replace(/\\mu|μ/g, ' mu ')
    .replace(/\\theta|θ/g, ' theta ')
    .replace(/\\pi|π/g, ' pi ')
    .replace(/\\frac|\\mathrm|\\to|\\sin|\\cos|\\tan|\\sqrt/g, ' ')
    .replace(/[_^{}()[\]=,+\-/*.:;·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPhysicsTokens(text: string) {
  return normalizePhysicsFormulaText(text)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !['de', 'la', 'el', 'y', 'en', 'con', 'del', 'para', 'una', 'un'].includes(token))
}

function scoreFormulaChoiceForExercise(
  formula: { label: string; latex: string },
  exercise: Pick<MockExamExercise, 'title' | 'prompt' | 'hint'>,
) {
  const fullText = `${exercise.title} ${exercise.prompt} ${exercise.hint}`
  const textTokens = new Set(extractPhysicsTokens(fullText))
  const labelTokens = Array.from(new Set(extractPhysicsTokens(formula.label)))
  const formulaTokens = Array.from(new Set(extractPhysicsTokens(formula.latex)))
  const formulaTokenSet = new Set(formulaTokens)
  const hintFormulaSegments = Array.from(exercise.hint.matchAll(/`([^`]+)`/g)).map((match) => match[1])
  let score = 0

  for (const token of labelTokens) {
    if (textTokens.has(token)) {
      score += 4
    }
  }

  for (const token of formulaTokens) {
    if (textTokens.has(token)) {
      score += token.length > 1 ? 2 : 1
    }
  }

  for (const [index, segment] of hintFormulaSegments.entries()) {
    const segmentTokens = Array.from(new Set(extractPhysicsTokens(segment)))
    const overlap = segmentTokens.filter((token) => formulaTokenSet.has(token)).length

    if (overlap > 0) {
      score += overlap * (index === 0 ? 7 : 3)
    }
  }

  return score
}

function hashString(value: string) {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return hash
}

function rotateItems<T>(items: T[], offset: number) {
  if (items.length === 0) {
    return []
  }

  const normalizedOffset = ((offset % items.length) + items.length) % items.length
  return items.slice(normalizedOffset).concat(items.slice(0, normalizedOffset))
}

function formatExamTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildMockExamQuestion(exercise: MockExamExercise): MockExamQuestion | null {
  const numericQuestion = numericMockExamQuestionByExerciseId[exercise.id]

  if (numericQuestion) {
    return {
      exerciseId: exercise.id,
      ...numericQuestion,
    }
  }

  const topicFormulas = allMockExamFormulaChoices.filter((formula) => formula.topicId === exercise.topicId)

  if (topicFormulas.length === 0) {
    return null
  }

  const seed = hashString(exercise.id)
  const scoredChoices = topicFormulas.map((formula) => ({
    formula,
    score: scoreFormulaChoiceForExercise(formula, exercise),
  }))
  const highestScore = Math.max(...scoredChoices.map((entry) => entry.score))
  const bestChoices =
    highestScore > 0
      ? scoredChoices.filter((entry) => entry.score === highestScore).map((entry) => entry.formula)
      : topicFormulas
  const correctChoice = bestChoices[seed % bestChoices.length]
  const localDistractors = rotateItems(
    topicFormulas.filter((formula) => formula.id !== correctChoice.id && formula.latex !== correctChoice.latex),
    seed + 3,
  )

  const pickedDistractors = [...localDistractors.slice(0, 2)]
  const usedLatex = new Set([correctChoice.latex, ...pickedDistractors.map((formula) => formula.latex)])
  const globalDistractors = rotateItems(
    allMockExamFormulaChoices.filter(
      (formula) => formula.id !== correctChoice.id && !usedLatex.has(formula.latex),
    ),
    seed + 11,
  )

  for (const distractor of globalDistractors) {
    if (pickedDistractors.length === 3) {
      break
    }

    pickedDistractors.push(distractor)
    usedLatex.add(distractor.latex)
  }

  const orderedOptions = rotateItems(
    [correctChoice, ...pickedDistractors.slice(0, 3)].map((formula) => ({
      id: formula.id,
      label: formula.label,
      latex: formula.latex,
    })),
    seed + 5,
  )

  return {
    exerciseId: exercise.id,
    mode: 'formula',
    prompt: `Selecciona la fórmula que mejor sirve como punto de partida para resolver este ejercicio de ${exercise.topicTitle}.`,
    options: orderedOptions,
    correctOptionId: correctChoice.id,
    correctLabel: correctChoice.label,
    correctLatex: correctChoice.latex,
    successMessage: 'Has elegido la fórmula guía adecuada para arrancar este problema.',
    failureMessage: 'La mejor opción para empezar este ejercicio era la siguiente:',
  }
}

function topicTitleById(topicId: string) {
  return studyModules.find((module) => module.id === topicId)?.title ?? topicId
}

function getTopicExercises(topicId: string, attempt: number): MockExamExercise[] {
  const exercises = exerciseSheetById[topicId]?.exercises ?? []
  const rotatedExercises = rotateItems(exercises, attempt + hashString(topicId))

  return rotatedExercises.map((exercise) => ({
    ...exercise,
    topicId,
    topicTitle: topicTitleById(topicId),
  }))
}

function getSyllabusBlockExercises(block: MockExamSyllabusBlock, attempt: number): MockExamExercise[] {
  const topicExercises = block.topicIds.flatMap((topicId, topicIndex) =>
    getTopicExercises(topicId, attempt + topicIndex),
  )

  return rotateItems(topicExercises, attempt + hashString(block.id))
}

function buildMockExam(block: MockExamBlock, attempt: number): MockExam | null {
  const sectionsWithExercises = block.sections.filter((section) =>
    section.topicIds.some((topicId) => (exerciseSheetById[topicId]?.exercises ?? []).length > 0),
  )

  if (sectionsWithExercises.length < mockExamSectionPoints.length) {
    return null
  }

  const configuredObligatoryBlock =
    sectionsWithExercises.find((section) => section.id === block.obligatorySectionId) ?? sectionsWithExercises[0]
  const optionalBlocks = sectionsWithExercises.filter((section) => section.id !== configuredObligatoryBlock.id)
  const rotatedOptionalBlocks = rotateItems(optionalBlocks, attempt)
  const obligatoryBlock = configuredObligatoryBlock
  const obligatoryExercises = getSyllabusBlockExercises(obligatoryBlock, attempt)
  const obligatoryExercise = obligatoryExercises[0]

  if (!obligatoryExercise) {
    return null
  }

  const optionals = rotatedOptionalBlocks
    .map((section) => {
      const exercises = getSyllabusBlockExercises(section, attempt).slice(0, 2)

      if (exercises.length < 2) {
        return null
      }

      return {
        blockId: section.id,
        topicTitle: section.title,
        exercises,
        points: 0,
      }
    })
    .filter((section): section is MockExamSection => Boolean(section))

  return {
    obligatory: {
      blockId: obligatoryBlock.id,
      topicTitle: obligatoryBlock.title,
      exercises: [obligatoryExercise],
      points: mockExamSectionPoints[0],
    },
    optionals: optionals.map((section, index) => ({
      ...section,
      points: mockExamSectionPoints[index + 1] ?? 0,
    })),
  }
}

function renderQuestionOptions({
  question,
  answers,
  correction,
  onAnswer,
}: {
  question: MockExamQuestion
  answers: Record<string, string>
  correction: Record<string, boolean> | null
  onAnswer: (exerciseId: string, optionId: string) => void
}) {
  return (
    <div className="mock-exam-quiz" aria-label="Respuesta tipo test">
      <span className="panel-label">Tipo test</span>
      <div className="mock-exam-option-grid" role="radiogroup">
        {question.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index)
          const isSelected = answers[question.exerciseId] === option.id
          const isCorrect = !!correction && option.id === question.correctOptionId
          const isWrong = !!correction && correction[question.exerciseId] === false && isSelected

          return (
            <button
              key={option.id}
              className={[
                'mock-exam-option',
                isSelected ? 'mock-exam-option-selected' : '',
                isCorrect ? 'mock-exam-option-correct' : '',
                isWrong ? 'mock-exam-option-wrong' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              onClick={() => onAnswer(question.exerciseId, option.id)}
              disabled={!!correction}
            >
              <span className="mock-exam-option-letter">{optionLetter}</span>
              <div className="mock-exam-option-copy">
                {option.label ? <strong>{option.label}</strong> : null}
                <MathFormula latex={option.latex} inline />
              </div>
            </button>
          )
        })}
      </div>
      {correction ? (
        <div className={`mock-exam-feedback ${correction[question.exerciseId] ? 'mock-exam-feedback-correct' : 'mock-exam-feedback-wrong'}`}>
          <strong>{correction[question.exerciseId] ? 'Correcta.' : 'Incorrecta.'}</strong>
          <p>{question.correctLabel}: <MathFormula latex={question.correctLatex} inline /></p>
        </div>
      ) : null}
    </div>
  )
}

function renderSolutionGuide({
  exercise,
  question,
  points,
  wasCorrect,
  renderTextWithMath,
}: {
  exercise: MockExamExercise
  question: MockExamQuestion
  points: number
  wasCorrect: boolean
  renderTextWithMath: (text: string) => ReactNode
}) {
  return (
    <div className={`mock-exam-solution ${wasCorrect ? 'mock-exam-solution-correct' : 'mock-exam-solution-wrong'}`}>
      <span className="panel-label">Solución guiada · {points} pts</span>
      <div className="mock-exam-solution-steps">
        <div className="mock-exam-solution-step">
          <strong>1. Identifica el bloque</strong>
          <p>{exercise.topicTitle}. Lee el enunciado y separa datos, magnitudes pedidas y unidades.</p>
        </div>
        <div className="mock-exam-solution-step">
          <strong>2. Plantea el camino</strong>
          <p className="practice-rich-text">{renderTextWithMath(exercise.hint)}</p>
        </div>
        <div className="mock-exam-solution-step">
          <strong>3. Respuesta clave</strong>
          <p>{question.correctLabel}</p>
          <div className="mock-exam-solution-formula">
            <MathFormula latex={question.correctLatex} />
          </div>
        </div>
        <div className="mock-exam-solution-step">
          <strong>4. Comprobación</strong>
          <p>
            {wasCorrect
              ? 'La opción marcada coincide con la respuesta correcta.'
              : 'Revisa el planteamiento anterior y compara tu opción con la respuesta correcta.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function MockExamView({
  blocks,
  selectedBlockId,
  onSelectBlock,
  renderTextWithMath,
}: MockExamViewProps) {
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? blocks[0]
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOptionalExerciseIds, setSelectedOptionalExerciseIds] = useState<Record<string, string>>({})
  const [correction, setCorrection] = useState<Record<string, boolean> | null>(null)
  const [examDurationMinutes, setExamDurationMinutes] = useState(defaultExamDurationMinutes)
  const [secondsRemaining, setSecondsRemaining] = useState(defaultExamDurationMinutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const mockExam = useMemo(
    () => selectedBlock ? buildMockExam(selectedBlock, attempt) : null,
    [attempt, selectedBlock],
  )
  const selectedOptionalQuestions = useMemo(() => {
    if (!mockExam) {
      return []
    }

    return mockExam.optionals.flatMap((section) => {
      const selectedExerciseId = selectedOptionalExerciseIds[section.blockId] ?? section.exercises[0]?.id
      const exercise = section.exercises.find((item) => item.id === selectedExerciseId) ?? section.exercises[0]
      const question = exercise ? buildMockExamQuestion(exercise) : null

      return exercise && question ? [{ blockId: section.blockId, exercise, question, points: section.points }] : []
    })
  }, [mockExam, selectedOptionalExerciseIds])
  const selectedExamItems = useMemo(() => {
    const examItems: Array<{
      exercise: MockExamExercise
      question: MockExamQuestion
      points: number
      blockTitle: string
    }> = []
    const obligatoryQuestion = mockExam?.obligatory.exercises[0]
      ? buildMockExamQuestion(mockExam.obligatory.exercises[0])
      : null

    if (obligatoryQuestion && mockExam?.obligatory.exercises[0]) {
      examItems.push({
        exercise: mockExam.obligatory.exercises[0],
        question: obligatoryQuestion,
        points: mockExam?.obligatory.points ?? 0,
        blockTitle: mockExam.obligatory.topicTitle,
      })
    }

    for (const item of selectedOptionalQuestions) {
      examItems.push({
        exercise: item.exercise,
        question: item.question,
        points: item.points,
        blockTitle: item.exercise.topicTitle,
      })
    }

    return examItems
  }, [mockExam, selectedOptionalQuestions])
  const maxScore = selectedExamItems.reduce((total, item) => total + item.points, 0)
  const score = correction
    ? selectedExamItems.reduce(
        (total, item) => total + (correction[item.question.exerciseId] ? item.points : 0),
        0,
      )
    : 0
  const answeredCount = selectedExamItems.filter((item) => answers[item.question.exerciseId]).length
  const totalQuestionCount = selectedExamItems.length
  const timeUsedSeconds = examDurationMinutes * 60 - secondsRemaining
  const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const weakExamItems = correction
    ? selectedExamItems.filter((item) => !correction[item.question.exerciseId])
    : []
  const weakTopicTitles = Array.from(new Set(weakExamItems.map((item) => item.exercise.topicTitle)))
  const allQuestionsAnswered = totalQuestionCount > 0 && answeredCount === totalQuestionCount
  const isTimeExpired = secondsRemaining === 0 && !correction

  useEffect(() => {
    setAttempt(0)
    setAnswers({})
    setSelectedOptionalExerciseIds({})
    setCorrection(null)
    setSecondsRemaining(examDurationMinutes * 60)
    setIsTimerRunning(false)
  }, [selectedBlockId])

  useEffect(() => {
    if (!mockExam || correction || !isTimerRunning) {
      return
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(timerId)
          setIsTimerRunning(false)
          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [correction, isTimerRunning, mockExam])

  function handleSelectBlock(blockId: string) {
    onSelectBlock(blockId)
  }

  function handleAnswer(exerciseId: string, optionId: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [exerciseId]: optionId }))
  }

  function handleOptionalChoice(blockId: string, exerciseId: string) {
    setSelectedOptionalExerciseIds((currentSelections) => ({ ...currentSelections, [blockId]: exerciseId }))
    setCorrection(null)
  }

  function handleDurationChange(durationMinutes: number) {
    setExamDurationMinutes(durationMinutes)
    setSecondsRemaining(durationMinutes * 60)
    setCorrection(null)
    setIsTimerRunning(false)
  }

  function toggleTimer() {
    if (!correction && secondsRemaining > 0) {
      setIsTimerRunning((currentValue) => !currentValue)
    }
  }

  function correctMockExam() {
    if (!mockExam) {
      return
    }

    const result: Record<string, boolean> = {}
    const obligatoryExercise = mockExam.obligatory.exercises[0]
    const obligatoryQuestion = obligatoryExercise ? buildMockExamQuestion(obligatoryExercise) : null

    if (obligatoryQuestion) {
      result[obligatoryQuestion.exerciseId] =
        answers[obligatoryQuestion.exerciseId] === obligatoryQuestion.correctOptionId
    }

    for (const { question } of selectedOptionalQuestions) {
      result[question.exerciseId] = answers[question.exerciseId] === question.correctOptionId
    }

    setCorrection(result)
    setIsTimerRunning(false)
  }

  function newMockExam() {
    setAttempt((currentAttempt) => currentAttempt + 1)
    setAnswers({})
    setSelectedOptionalExerciseIds({})
    setCorrection(null)
    setSecondsRemaining(examDurationMinutes * 60)
    setIsTimerRunning(false)
  }

  return (
    <section className="card mock-exam-viewer">
      <div className="section-heading practice-heading">
        <div>
          <p className="eyebrow">Simulacro PAU 2026</p>
          <h2>{selectedBlock.title}</h2>
        </div>
      </div>
      <div className="filter-bar" aria-label="Selección de bloque de simulacro">
        {blocks.map((block) => (
          <button
            key={block.id}
            className={`filter-chip ${selectedBlockId === block.id ? 'filter-chip-active' : ''}`}
            type="button"
            onClick={() => handleSelectBlock(block.id)}
          >
            {block.title}
          </button>
        ))}
      </div>
      <p className="mock-exam-description">{selectedBlock.description}</p>
      {mockExam ? (
        <form className="pau-simulacro-form" onSubmit={(event) => { event.preventDefault(); correctMockExam() }}>
          <div className="mock-exam-control-panel" aria-label="Panel de control del simulacro">
            <div className={`mock-exam-timer ${secondsRemaining <= 300 && !correction ? 'mock-exam-timer-warning' : ''} ${isTimeExpired ? 'mock-exam-timer-expired' : ''}`}>
              <span className="panel-label">Tiempo restante</span>
              <strong>{formatExamTime(secondsRemaining)}</strong>
              <button
                className="mock-exam-start-button"
                type="button"
                onClick={toggleTimer}
                disabled={!!correction || secondsRemaining === 0}
              >
                {isTimerRunning ? 'Pausar tiempo' : secondsRemaining === 0 ? 'Tiempo agotado' : secondsRemaining < examDurationMinutes * 60 ? 'Reanudar tiempo' : 'Iniciar tiempo'}
              </button>
            </div>
            <div className="mock-exam-progress">
              <span className="panel-label">Progreso</span>
              <strong>{answeredCount} / {totalQuestionCount}</strong>
              <div className="mock-exam-progress-track" aria-hidden="true">
                <span style={{ width: `${totalQuestionCount > 0 ? (answeredCount / totalQuestionCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="mock-exam-duration" aria-label="Duración del simulacro">
              <span className="panel-label">Duración</span>
              <div className="mock-exam-duration-options">
                {examDurationOptions.map((duration) => (
                  <button
                    key={duration}
                    className={`filter-chip ${examDurationMinutes === duration ? 'filter-chip-active' : ''}`}
                    type="button"
                    onClick={() => handleDurationChange(duration)}
                    disabled={(answeredCount > 0 || isTimerRunning) && !correction}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pau-simulacro-grid">
            <article className="practice-card pau-obligatoria">
              <span className="panel-label">Obligatoria ({mockExam.obligatory.points} pts)</span>
              <h3>{mockExam.obligatory.exercises[0].title}</h3>
              <p className="practice-meta">
                {mockExam.obligatory.topicTitle} · {mockExam.obligatory.exercises[0].source} · dificultad {mockExam.obligatory.exercises[0].difficulty}
              </p>
              <p className="practice-rich-text">{renderTextWithMath(mockExam.obligatory.exercises[0].prompt)}</p>
              {(() => {
                const question = buildMockExamQuestion(mockExam.obligatory.exercises[0])

                if (!question) {
                  return <p>No hay pregunta tipo test.</p>
                }

                return (
                  <>
                    <p className="mock-exam-quiz-question practice-rich-text">{renderTextWithMath(question.prompt)}</p>
                    {renderQuestionOptions({ question, answers, correction, onAnswer: handleAnswer })}
                    {correction ? renderSolutionGuide({
                      exercise: mockExam.obligatory.exercises[0],
                      question,
                      points: mockExam.obligatory.points,
                      wasCorrect: correction[question.exerciseId] === true,
                      renderTextWithMath,
                    }) : null}
                  </>
                )
              })()}
            </article>

            {mockExam.optionals.map((section, index) => {
              const selectedExerciseId = selectedOptionalExerciseIds[section.blockId] ?? section.exercises[0]?.id
              const selectedExercise = section.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? section.exercises[0]
              const question = selectedExercise ? buildMockExamQuestion(selectedExercise) : null

              return (
                <article className="practice-card pau-opcional" key={section.blockId}>
                  <span className="panel-label">Bloque {index + 2} ({section.points} pts)</span>
                  <h3>{section.topicTitle}</h3>
                  <div className="filter-bar" aria-label={`Elegir opción de ${section.topicTitle}`}>
                    {section.exercises.map((exercise, exerciseIndex) => (
                      <button
                        key={exercise.id}
                        className={`filter-chip ${exercise.id === selectedExercise?.id ? 'filter-chip-active' : ''}`}
                        type="button"
                        onClick={() => handleOptionalChoice(section.blockId, exercise.id)}
                        disabled={!!correction}
                      >
                        Opción {exerciseIndex === 0 ? 'A' : 'B'}
                      </button>
                    ))}
                  </div>
                  {selectedExercise && question ? (
                    <div className="pau-opcional-exercise">
                      <h4>{selectedExercise.title}</h4>
                      <p className="practice-meta">
                        {selectedExercise.source} · dificultad {selectedExercise.difficulty}
                      </p>
                      <p className="practice-rich-text">{renderTextWithMath(selectedExercise.prompt)}</p>
                      <p className="mock-exam-quiz-question practice-rich-text">{renderTextWithMath(question.prompt)}</p>
                      {renderQuestionOptions({ question, answers, correction, onAnswer: handleAnswer })}
                      {correction ? renderSolutionGuide({
                        exercise: selectedExercise,
                        question,
                        points: section.points,
                        wasCorrect: correction[question.exerciseId] === true,
                        renderTextWithMath,
                      }) : null}
                    </div>
                  ) : (
                    <p>No hay pregunta tipo test.</p>
                  )}
                </article>
              )
            })}
          </div>
          <div className="practice-actions pau-actions">
            <button className="practice-button" type="submit" disabled={!!correction}>
              Entregar y corregir
            </button>
            <button className="practice-button practice-button-muted" type="button" onClick={newMockExam}>
              Nuevo simulacro
            </button>
            {!correction && !allQuestionsAnswered ? (
              <span className="mock-exam-description">
                Faltan {totalQuestionCount - answeredCount} respuestas.
              </span>
            ) : null}
          </div>
          {correction ? (
            <section className="mock-exam-results" aria-label="Resultado del simulacro">
              <div className="mock-exam-result-main">
                <span className="panel-label">Resultado final</span>
                <strong>{score.toFixed(1)} / {maxScore}</strong>
                <p>{scorePercentage}% del simulacro en {formatExamTime(timeUsedSeconds)}.</p>
              </div>
              <div className="mock-exam-result-grid">
                <div>
                  <span className="panel-label">Aciertos</span>
                  <strong>{selectedExamItems.length - weakExamItems.length} / {selectedExamItems.length}</strong>
                </div>
                <div>
                  <span className="panel-label">Ritmo</span>
                  <strong>{timeUsedSeconds > 0 ? `${Math.round(timeUsedSeconds / Math.max(selectedExamItems.length, 1) / 60)} min` : '0 min'}</strong>
                  <p>por pregunta</p>
                </div>
                <div>
                  <span className="panel-label">Siguiente repaso</span>
                  <strong>{weakTopicTitles.length > 0 ? weakTopicTitles[0] : 'Mantener'}</strong>
                  <p>{weakTopicTitles.length > 1 ? weakTopicTitles.slice(1).join(' · ') : 'Repite uno similar para consolidar.'}</p>
                </div>
              </div>
            </section>
          ) : null}
        </form>
      ) : (
        <article className="practice-card">
          <h3>Bloque sin ejercicios suficientes</h3>
          <p>
            Este simulacro aún no tiene banco EVAU propio para ningún tema del bloque. Se puede
            ampliar cuando añadamos más ejercicios en <code>content/ejercicios</code>.
          </p>
        </article>
      )}
    </section>
  )
}

export default MockExamView
