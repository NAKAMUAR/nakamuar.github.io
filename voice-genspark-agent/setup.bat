@echo off
REM ============================================================
REM  音声操作 Genspark アシスタント セットアップ (Windows・初回のみ)
REM  仮想環境作成 → 依存インストール → .env 準備 を自動で行う
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

where py >nul 2>nul && (set "PY=py") || (set "PY=python")

echo === セットアップ（初回のみ）===
echo [1/3] 仮想環境 .venv を作成...
%PY% -m venv .venv || (echo 仮想環境の作成に失敗しました。Python がインストール済みか確認してください。& pause & exit /b 1)

call ".venv\Scripts\activate.bat"

echo [2/3] 依存パッケージをインストール...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt || (echo 依存インストールに失敗しました。& pause & exit /b 1)

echo [3/3] .env を準備...
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo   .env を作成しました。メモ帳などで開き、GEMINI_API_KEY を記入してください。
) else (
    echo   .env は既に存在します（上書きしません）。
)

echo.
echo ============================================================
echo  セットアップ完了。
echo  次の手順:
echo   1) .env に GEMINI_API_KEY を記入
echo      （無料取得: https://aistudio.google.com/apikey）
echo   2) 配線確認:  .venv\Scripts\activate  ^&^&  python selftest.py
echo   3) 本番起動:  start.bat
echo ============================================================
pause
