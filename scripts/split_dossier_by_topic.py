from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'content/extraido/dossier-ebau-extraido.txt'
TARGET_DIR = ROOT / 'content/extraido/temas'

TOPIC_MARKERS = [
    ('01-02-ondas-sonido', 'TEMA 2  +  TEMA 3  – ONDAS Y SONIDO', 'TEMA 4 – GRAVITACIÓN'),
    ('03-gravitacion', 'TEMA 4 – GRAVITACIÓN', 'TEMA 5 – CAMPO ELÉCTRICO'),
    ('04-campo-electrico', 'TEMA 5 – CAMPO ELÉCTRICO', 'TEMA 6 – CAMPO MAGNÉTICO'),
    ('05-campo-magnetico', 'TEMA 6 – CAMPO MAGNÉTICO', 'TEMA 7 – INDUCCIÓN ELECTROMAGNÉTICA'),
    ('06-induccion-electromagnetica', 'TEMA 7 – INDUCCIÓN ELECTROMAGNÉTICA', 'TEMA 8 – ÓPTICA FÍSICA'),
    ('08-optica-fisica', 'TEMA 8 – ÓPTICA FÍSICA', 'TEMA 9 – ÓPTICA GEOMÉTRICA'),
    ('09-optica-geometrica', 'TEMA 9 – ÓPTICA GEOMÉTRICA', 'TEMA 10 – RELATIVIDAD ESPECIAL'),
    ('10-relatividad-especial', 'TEMA 10 – RELATIVIDAD ESPECIAL', 'TEMA 11 – FÍSICA CUÁNTICA'),
    ('11-fisica-cuantica', 'TEMA 11 – FÍSICA CUÁNTICA', 'TEMA 12 – FÍSICA NUCLEAR'),
    ('12-fisica-nuclear', 'TEMA 12 – FÍSICA NUCLEAR', None),
]


def slice_block(text: str, start_marker: str, end_marker: Optional[str]) -> str:
    start = text.index(start_marker)
    end = len(text) if end_marker is None else text.index(end_marker)
    return text[start:end].strip()


def main() -> None:
    text = SOURCE.read_text(encoding='utf-8')
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    for slug, start_marker, end_marker in TOPIC_MARKERS:
        block = slice_block(text, start_marker, end_marker)
        target = TARGET_DIR / f'{slug}.md'
        target.write_text(f'# {slug}\n\n```text\n{block}\n```\n', encoding='utf-8')
        print(f'Generado: {target.name}')


if __name__ == '__main__':
    main()