import ondasRaw from '../../content/ejercicios/01-ondas/pau-ebau.md?raw'
import gravitacionRaw from '../../content/ejercicios/03-gravitacion/pau-ebau.md?raw'
import campoElectricoRaw from '../../content/ejercicios/04-campo-electrico/pau-ebau.md?raw'
import campoMagneticoRaw from '../../content/ejercicios/05-campo-magnetico/pau-ebau.md?raw'
import induccionRaw from '../../content/ejercicios/06-induccion-electromagnetica/pau-ebau.md?raw'
import opticaFisicaRaw from '../../content/ejercicios/08-optica-fisica/pau-ebau.md?raw'
import opticaGeometricaRaw from '../../content/ejercicios/09-optica-geometrica/pau-ebau.md?raw'
import relatividadRaw from '../../content/ejercicios/10-relatividad-especial/pau-ebau.md?raw'
import cuanticaRaw from '../../content/ejercicios/11-fisica-cuantica/pau-ebau.md?raw'
import nuclearRaw from '../../content/ejercicios/12-fisica-nuclear/pau-ebau.md?raw'

export type ExerciseEntry = {
  id: string
  title: string
  source: string
  type: string
  difficulty: string
  prompt: string
  hint: string
  sourcePath: string
}

export type ExerciseSheet = {
  id: string
  title: string
  exercises: ExerciseEntry[]
}

const rawExerciseSheets = [
  { id: '01-ondas', raw: ondasRaw },
  { id: '03-gravitacion', raw: gravitacionRaw },
  { id: '04-campo-electrico', raw: campoElectricoRaw },
  { id: '05-campo-magnetico', raw: campoMagneticoRaw },
  { id: '06-induccion-electromagnetica', raw: induccionRaw },
  { id: '08-optica-fisica', raw: opticaFisicaRaw },
  { id: '09-optica-geometrica', raw: opticaGeometricaRaw },
  { id: '10-relatividad-especial', raw: relatividadRaw },
  { id: '11-fisica-cuantica', raw: cuanticaRaw },
  { id: '12-fisica-nuclear', raw: nuclearRaw },
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseNamedSections(block: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const matches = block.matchAll(/###\s+([^\n]+)\n([\s\S]*?)(?=\n###\s+|$)/g)

  for (const match of matches) {
    const [, name, content] = match
    sections[name.trim()] = content.trim()
  }

  return sections
}

function parseExerciseSheet(id: string, raw: string): ExerciseSheet {
  const blocks = raw
    .split('\n## Ejercicio: ')
    .map((block) => block.trim())
    .filter(Boolean)

  const [header, ...exerciseBlocks] = blocks
  const title = header.replace(/^#\s+/, '').trim()

  const exercises = exerciseBlocks.map((block) => {
    const [exerciseTitleLine, ...restLines] = block.split('\n')
    const sections = parseNamedSections(restLines.join('\n'))
    const exerciseTitle = exerciseTitleLine.trim()

    return {
      id: `${id}-${slugify(exerciseTitle)}`,
      title: exerciseTitle,
      source: sections.Fuente ?? 'Fuente no indicada',
      type: sections.Tipo ?? 'problema',
      difficulty: sections.Dificultad ?? 'media',
      prompt: sections.Enunciado ?? '',
      hint: sections.Pista ?? '',
      sourcePath: sections.Archivo ?? '',
    }
  })

  return { id, title, exercises }
}

export const exerciseSheets = rawExerciseSheets.map(({ id, raw }) => parseExerciseSheet(id, raw))

export const exerciseSheetById = Object.fromEntries(
  exerciseSheets.map((sheet) => [sheet.id, sheet]),
) as Partial<Record<string, ExerciseSheet>>