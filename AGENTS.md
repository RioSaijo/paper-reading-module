# Paper Reading Module: operation rules

## Scope and authority
Read this file and papers/_template.tex before every addition/update.
Screen Building Services and Information research. LaTeX + BibTeX are authoritative;
JSON is the synchronized index; PDF is derived and must never be edited directly.
Never import reference-repository papers, bibliography, IDs, categories, metadata or queues.
Initial library: zero papers, empty bibliography/queue, next_paper_id=1.

## Inputs and grounding
Accept attached PDF, DOI, DOI URL, arXiv URL, publisher/article/repository URL, title or title + authors.
Resolve identity using PDF or formal DOI information when available.
Verify bibliography with publisher > DOI metadata > Crossref > arXiv > PDF > other sources.
Never infer DOI, year, journal, volume, issue, pages, sample/dataset sizes, numerical results,
experimental conditions, novelty, metrics or performance. Unknown JSON values are null;
unknown BibTeX fields are omitted; unverified review text is 要検討.
Record source and locator for every review; distinguish author_claim and interpretation.
Check all numbers against the full text. Evidence records do not automatically prove a claim.
Without full text use 要検討 for review fields and registered status.

## IDs and duplicates
Before issuing an ID check DOI, arXiv ID (version-independent), normalized title,
then title + first author + year. Same paper updates its existing entry, never a second ID.
Use P001, P002, ... in addition order. Never decrement next_paper_id, even after deletion.
Paper ID, BibTeX key and citation number are independent.
Use scripts/library.mjs to register a verified dossier. Resolve conflicting matches first.

## Fixed card
Paper ID and Title in subsection, Authors, Major Category, optional Secondary Category, Keywords,
主な主張, 新規性, 位置付け. Each review is 1-2 sentences; no long review.
Main claim describes the demonstrated result, not merely purpose; inspect Results/Discussion/Conclusion.
Novelty describes an evidenced difference from prior work, otherwise 要検討.
Positioning describes its role without unsupported importance claims; identify your interpretation.
DOI/journal details stay in references.bib and metadata.
Each card cites itself. References use unsrt citation order on a new final page. Never nocite{*}.

## Classification and keywords
Use 12 exact names in metadata/categories.json; use Uncategorized if uncertain.
Classify by objective, methodology, evaluation target and primary contribution, not title words.
PM2.5 prediction using Digital Twin may be primary Building Environment and IEQ;
Digital Twin architecture may be primary Digital Twin. Record the contribution rationale.
Include each card once in its primary section; secondary categories do not duplicate cards.
Use 3-8 keywords, author keywords first, with controlled terms as needed.
Normalize synonyms (e.g. Building Management Systems -> BMS). Explain exceptions in keyword_exception.

## Registration
1. Read this file and template.
2. Resolve identity, detect duplicates, verify bibliography, read necessary full text.
3. Prepare grounded dossier (docs/registration.md); run duplicates then register.
4. Register updates target card, bibliography, index, section and outputs saved record.
5. Validate, push sources to main, check Build PDF and Deploy PDF to Pages.
6. Display saved [Pxxx], Title, Authors, Category, Keywords, 主な主張, 新規性, 位置付け in chat.
Never end with only "追加しました".

## Selection and handoff
registered: bibliography only; screened: short review complete; review_candidate: selected;
queued_for_review: handoff created; reviewed: downstream review complete.
Use status command and handoff command. Preserve user focus/questions verbatim.
Give grounded selection reasons; never use unverified citation counts.
Detailed derivations, figure/table transcription, reproduction, statistical/claim audits,
reference networks and long critical reviews belong to paper-review-module.

## Checks
Run npm test and npm run validate after code changes, validate after paper edits.
Source truth and numerical evidence require operator verification.
When editing authoritative TeX/BibTeX, reconcile JSON. Validator rejects disagreements.
Never overwrite unrelated edits or silently discard reviews.
Review PDF rendering after layout changes.
