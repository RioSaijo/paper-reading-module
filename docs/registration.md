# 登録とhandoff
AGENTS.mdとテンプレートを読む。入力PDF/DOI/URL/タイトルを特定し、重複確認、
書誌照合、必要な本文確認を行う。数値には本文のページ等を記録する。
以下は説明用プレースホルダであり登録文献ではない。

## dossier.json
```json
{
  "title": "<verified title>",
  "authors": ["<verified author>"],
  "year": null,
  "doi": null,
  "arxiv_id": null,
  "bibtex_key": "VerifiedAuthorTopic",
  "source_url": null,
  "local_pdf": null,
  "primary_category": "Uncategorized",
  "secondary_categories": [],
  "keywords": [],
  "keyword_exception": "要検討: insufficient information",
  "review_status": "registered",
  "full_text_checked": false,
  "bibliography_type": "article",
  "bibliography": {
    "title": "<verified title>",
    "author": "<verified author>"
  },
  "screening_review": {
    "main_claim": "要検討",
    "novelty": "要検討",
    "positioning": "要検討"
  },
  "evidence": {
    "bibliography": {
      "title": {"source": "<publisher or DOI URL>"},
      "author": {"source": "<publisher or DOI URL>"}
    },
    "review": {},
    "classification": null
  }
}
```
bibliography.authorはauthorsを " and " で結合する。
確認できたjournal/year/volume/number/pages/doi/url、またはeprint/archivePrefix/primaryClassを追加する。
全項目にevidence.bibliography.FIELD.sourceが必要。year/doi/eprint/urlは索引と一致させる。

「要検討」以外の各レビューはevidence.review.main_claim/novelty/positioningに
`{"source":"PDF URL or authorized path","locator":"p. 5, Results","kind":"author_claim"}`
を記録する。Codexの解釈はkind: interpretation。
分類には`{"source":"...","rationale":"objective, method, evaluation, contribution"}`を
evidence.classificationへ記録する。証拠URLの存在だけでは内容の正しさを保証しない。

## Commands
```sh
node scripts/library.mjs duplicates dossier.json
node scripts/library.mjs register dossier.json
node scripts/library.mjs validate
node scripts/library.mjs status P001 review_candidate
node scripts/library.mjs handoff P001 request.json
```
重複時は元IDとBibTeX keyで更新。矛盾した重複は停止。
queued/reviewed文献の内容変更にはhandoffとの整合更新が必要。
TeX/BibTeXを直接編集した場合は対応JSONを同期する。不一致はvalidatorが停止する。
一度発行したIDは再利用しない。削除してもnext_paper_idを戻さない。
CLIはロックを取り、失敗時は対象ライブラリファイルをロールバックする。

## request.json
```json
{
  "focus": ["methodology", "data requirements", "ontology architecture", "evaluation metrics"],
  "user_questions": ["BMS dataとBIMの連携方式は何か", "既往研究との差はどこにあるか"]
}
```
review_queue/Pxxx.jsonをpaper-review-moduleへ渡す。短評・書誌・focus・質問を保持する。
チャットには必ず実際に保存した[Pxxx], Title, Authors, Category, Keywords,
主な主張, 新規性, 位置付けを表示する。
