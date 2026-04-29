import katex from 'katex'
import { useMemo } from 'react'

type MathFormulaProps = {
  latex: string
  inline?: boolean
}

function MathFormula({ latex, inline = false }: MathFormulaProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: !inline,
        throwOnError: false,
      }),
    [inline, latex],
  )

  if (inline) {
    return <span className="math-formula math-formula-inline" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <div className="math-formula" dangerouslySetInnerHTML={{ __html: html }} />
}

export default MathFormula