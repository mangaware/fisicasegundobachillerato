import ondasRaw from '../../content/formulas/01-ondas/formulario.md?raw'
import sonidoRaw from '../../content/formulas/02-sonido/formulario.md?raw'
import gravitacionRaw from '../../content/formulas/03-gravitacion/formulario.md?raw'
import campoElectricoRaw from '../../content/formulas/04-campo-electrico/formulario.md?raw'
import campoMagneticoRaw from '../../content/formulas/05-campo-magnetico/formulario.md?raw'
import induccionRaw from '../../content/formulas/06-induccion-electromagnetica/formulario.md?raw'
import opticaFisicaRaw from '../../content/formulas/08-optica-fisica/formulario.md?raw'
import opticaGeometricaRaw from '../../content/formulas/09-optica-geometrica/formulario.md?raw'
import relatividadRaw from '../../content/formulas/10-relatividad-especial/formulario.md?raw'
import cuanticaRaw from '../../content/formulas/11-fisica-cuantica/formulario.md?raw'
import nuclearRaw from '../../content/formulas/12-fisica-nuclear/formulario.md?raw'

export type FormulaEntry = {
  label: string
  latex: string
}

export type FormulaSheet = {
  id: string
  title: string
  formulas: FormulaEntry[]
}

const rawFormulaSheets = [
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

function parseFormulaSheet(id: string, raw: string): FormulaSheet {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const title = lines[0].replace(/^#\s+/, '')
  const formulas = lines
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2))
    .map((line) => {
      const [label, latex] = line.split(' :: ')

      return {
        label: label?.trim() ?? line.trim(),
        latex: latex?.trim() ?? line.trim(),
      }
    })

  return { id, title, formulas }
}

export const formulaSheets = rawFormulaSheets.map(({ id, raw }) => parseFormulaSheet(id, raw))

export const formulaSheetById = Object.fromEntries(
  formulaSheets.map((sheet) => [sheet.id, sheet]),
) as Record<string, FormulaSheet>