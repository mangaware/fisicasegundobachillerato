import ondasRaw from '../../content/temas/01-ondas.md?raw'
import sonidoRaw from '../../content/temas/02-sonido.md?raw'
import gravitacionRaw from '../../content/temas/03-gravitacion.md?raw'
import campoElectricoRaw from '../../content/temas/04-campo-electrico.md?raw'
import campoMagneticoRaw from '../../content/temas/05-campo-magnetico.md?raw'
import induccionRaw from '../../content/temas/06-induccion-electromagnetica.md?raw'
import opticaFisicaRaw from '../../content/temas/08-optica-fisica.md?raw'
import opticaGeometricaRaw from '../../content/temas/09-optica-geometrica.md?raw'
import relatividadRaw from '../../content/temas/10-relatividad-especial.md?raw'
import cuanticaRaw from '../../content/temas/11-fisica-cuantica.md?raw'
import nuclearRaw from '../../content/temas/12-fisica-nuclear.md?raw'

export type TopicSection = {
  title: string
  paragraphs: string[]
  bullets: string[]
}

export type TopicSheet = {
  id: string
  title: string
  sections: TopicSection[]
}

const rawTopicSheets = [
  { id: '01-ondas', raw: ondasRaw },
  { id: '02-sonido', raw: sonidoRaw },
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

function parseTopicSheet(id: string, raw: string): TopicSheet {
  const blocks = raw
    .split('\n## ')
    .map((block) => block.trim())
    .filter(Boolean)

  const [header, ...sectionBlocks] = blocks
  const title = header.replace(/^#\s+/, '').trim()

  const sections = sectionBlocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const [sectionTitle, ...contentLines] = lines

    const paragraphs: string[] = []
    const bullets: string[] = []

    for (const line of contentLines) {
      if (line.startsWith('- ')) {
        bullets.push(line.slice(2).trim())
        continue
      }

      paragraphs.push(line)
    }

    return {
      title: sectionTitle,
      paragraphs,
      bullets,
    }
  })

  return { id, title, sections }
}

export const topicSheets = rawTopicSheets.map(({ id, raw }) => parseTopicSheet(id, raw))

export const topicSheetById = Object.fromEntries(
  topicSheets.map((sheet) => [sheet.id, sheet]),
) as Record<string, TopicSheet>