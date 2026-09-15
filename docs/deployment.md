# Build and publication
1. GitHubにRioSaijo/paper-reading-moduleを作成しmainへpushする。
2. Settings > Pages > SourceをGitHub Actionsにする。
3. Actionsにrepository contents書込み権限を許可する。
4. Build PDFを実行し、続くDeploy PDF to Pagesの成功を確認する。
5. https://RioSaijo.github.io/paper-reading-module/ と固定PDFリンクをブラウザで確認する。
6. 確認後にREADMEの公開状態を更新する。

Build PDFは整合検証・テスト後、pLaTeX + pBibTeX + dvipdfmxでコンパイルし、
artifactとrootのpaper-reading-notes.pdfを保存する。新しいソースがあれば古いPDFのpushを止める。
PDFのみのcommitはbuild pathに含まれず、再帰実行しない。PRは公開しない。
workflow_runでPagesを公開。内容ハッシュ付きファイル名はPDF変更時に変わる。
HTMLのcache hintは全HTTP cacheを制御できないため、version付きURLで分離する。

ローカルはTeX Live (Japanese packages含む) とlatexmkを導入してnpm run build:pdf。
空ライブラリではBibTeXを呼ばず、最後の独立ページにReferencesを表示する。
登録後はunsrtで初回引用順に番号を付ける。testsの疑似文献は.tmpのコピーのみで登録する。
latexmkがない環境のPDF結合テストは明示的にskipする。
