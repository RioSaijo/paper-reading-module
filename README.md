# Paper Reading Module
Building Services and Information research paper library.

## Latest PDF
[Open the latest Paper Reading Notes](https://RioSaijo.github.io/paper-reading-module/)  
[Stable PDF](https://RioSaijo.github.io/paper-reading-module/paper-reading-notes.pdf)

公開状態: 初回GitHub作成・Actions実行・Pages公開の確認待ち。上記は公開予定URLです。

## Purpose
建築設備・建築環境・建築情報の文献を短く読み、分類・蓄積し、精読対象を選ぶライブラリです。
**初期状態は文献0件、次のIDはP001。** お手本の文献・書誌・IDは引き継ぎません。

LaTeX + BibTeX → 正本 / JSON → 索引・連携 / PDF → 閲覧。

## Use
Node.js 22+ (npm依存なし)、TeX LiveのpLaTeX・pBibTeX・dvipdfmx・latexmkを使用します。

```sh
npm test
npm run validate
node scripts/library.mjs duplicates dossier.json
node scripts/library.mjs register dossier.json
npm run build:pdf
node scripts/library.mjs status P001 review_candidate
node scripts/library.mjs handoff P001 request.json
```

[登録手順](docs/registration.md) · [運用規則](AGENTS.md) · [公開手順](docs/deployment.md)

PDF、DOI、arXiv・出版社・機関URL、タイトル（著者併記可）をチャットに入力します。
Codexが正式書誌と本文を確認し、根拠つきdossierを作成します。
CLI単独で新規性や本文内容を推定する機能はありません。

分類はA-Lの12分野とUncategorized。ID、BibTeX key、引用順番号は独立しています。
不明なレビューは「要検討」、JSON値はnull、未確認BibTeX fieldは省略します。
ソース更新によりActionsがPDFをrootへ保存し、Pagesが内容ハッシュ付きPDFへ誘導します。
安定した固定PDFリンクも保持します。

## Reference structure
[paper_reading_module_Komei](https://github.com/RioSaijo/paper_reading_module_Komei)
のjsarticle、独立カード、sections、pLaTeX、PDF公開構造を参考に新規作成しました。
引用順を満たすunsrtへ変更しています。お手本の文献データはコピーしていません。
