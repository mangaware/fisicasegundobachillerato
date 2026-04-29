from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'content/00-inbox/DOSSIER DE FÓRMULAS Y CS. TEÓRICAS - FÍSICA 2º BACH. (E.B.A.U.) (2)-2.pdf'
TARGET = ROOT / 'content/extraido/dossier-ebau-extraido.txt'


def main() -> None:
    reader = PdfReader(str(SOURCE))
    chunks: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ''
        chunks.append(f'===== PAGINA {index} =====\n{text.strip()}\n')

    TARGET.write_text('\n'.join(chunks), encoding='utf-8')
    print(f'Paginas extraidas: {len(reader.pages)}')
    print(f'Archivo generado: {TARGET}')


if __name__ == '__main__':
    main()