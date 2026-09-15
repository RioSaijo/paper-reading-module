# Initial implementation verification

## Initial state

- `papers/` contains only `_template.tex`.
- `references.bib` contains comments only, with no entries.
- `metadata/paper_index.json`: schema 1.0, next_paper_id 1, papers empty.
- Review queue contains only its empty index.
- Twelve building/information categories and Uncategorized are present.
- No reference-repository paper files, bibliography, metadata, IDs or section contents were copied.

## Automated checks

`npm test` runs independent temporary libraries, keeping the real library empty.
It checks first registration as P001, duplicate updates without advancing the counter,
normalized identifiers, conflicting identity matches, evidence rejection and rollback,
full-text screening gates, handoff focus/questions, preservation of the ID counter,
and source/index consistency.

When LaTeX is installed, the same suite compiles an empty library, then P001, then
two test cards. It verifies the self-citation and BibTeX entry in the generated
bibliography, and confirms ZTest precedes ATest2 despite reverse alphabetical order.
The temporary P001 is also exported to the downstream handoff schema.
Synthetic test records are not actual research and never enter the published library.

CI installs the required Japanese LaTeX environment, so the PDF test must run there.
Local machines without latexmk explicitly skip that test.

## Publication

- [Actions](https://github.com/RioSaijo/paper-reading-module/actions)
- [Latest PDF](https://RioSaijo.github.io/paper-reading-module/)
- [Stable PDF](https://RioSaijo.github.io/paper-reading-module/paper-reading-notes.pdf)

The first build and Pages deployment succeeded on 2026-09-15. The root PDF is an
automatically committed artifact; the Pages root redirects to a content-hash filename.
`.pdf-source.sha` ties subsequent publications to the source commit and prevents
deployment of a PDF from a different source revision.

Final verification on 2026-09-15:

- [Build PDF: 9 tests passed, none skipped](https://github.com/RioSaijo/paper-reading-module/actions/runs/34941904170)
- [Pages deployment succeeded](https://github.com/RioSaijo/paper-reading-module/actions/runs/34942151580)
- PDF: 16 pages, A4 (595.28 x 841.89 pt); cover, contents, category headings and final References visually checked.
- Japanese font substitution warnings from the first draft were resolved with IPAex embedding.
- Stable PDF served as application/pdf and matched the repository PDF byte-for-byte.
- SHA-256: 05c4a60a6897079e7f67a21269a66f0d613d3b6c2f196d91e9b376fd9f537d83.
- Pages root redirected to paper-reading-notes-05c4a60a6897.pdf.

## Operational limits

Bibliographic verification and reading source passages are operator responsibilities.
The CLI checks evidence references and consistency; it does not prove the truth of
the cited evidence or independently infer a paper's contribution. A real PDF/DOI
is resolved and reviewed by Codex before registration, following AGENTS.md.
The initial integration tests use synthetic inputs rather than claiming to have
screened a real paper. The first real registered paper will therefore be P001.
