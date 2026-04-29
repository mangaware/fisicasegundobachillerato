# Material extraido automaticamente

Esta carpeta guarda texto extraido de PDFs para poder reutilizarlo al separar teoria, formulas y cuestiones por tema.

## Flujo actual

1. `scripts/extract_dossier.py` extrae el dossier global EBAU a texto plano.
2. `scripts/split_dossier_by_topic.py` corta ese texto en bloques tematicos reutilizables.
3. Esos bloques se usan para rellenar las fichas de `content/temas/`.

## Nota

La extraccion funciona porque el PDF contiene texto seleccionable.