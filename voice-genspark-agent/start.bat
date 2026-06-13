@echo off
REM ============================================================
REM  音声操作 Genspark アシスタント ランチャー (Windows)
REM  1) Genspark を既定ブラウザで開く（手動でサイトを開くのと同じ操作）
REM  2) 音声アシスタント(main.py)を起動する
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

echo [1/2] Genspark をブラウザで開きます...
start "" "https://www.genspark.ai/"

echo [2/2] 音声アシスタントを起動します...

REM 仮想環境があれば有効化（無ければスキップしてシステムの python を使用）
if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
) else (
    echo   ※ .venv が見つかりません。初回は README のセットアップを実施してください。
)

REM python ランチャー(py)を優先、無ければ python を使用
where py >nul 2>nul
if %errorlevel%==0 (
    py main.py
) else (
    python main.py
)

echo.
echo 終了しました。ウィンドウを閉じるには何かキーを押してください。
pause >nul
