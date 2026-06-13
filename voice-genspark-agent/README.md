# 音声操作型 Genspark アシスタント（規約順守版 MVP）

音声で指示を出すと、ローカルで音声認識し、Gemini で「Genspark に渡す最適な依頼文」を
組み立て、**確認のうえでクリップボードへ受け渡す**最小構成の実装です。

> ⚠️ **重要（設計方針の変更点）**
> 当初設計（`DESIGN.md`）は browser-use で Genspark を**自動操作**する想定でしたが、
> 実装着手前の規約調査（設計書 §7-第二／§9 が必須とした項目）の結果、
> **その方式は採用していません。** 理由は以下の2点です。
>
> 1. **規約違反のおそれ。** Genspark の利用規約は「スクレイピング・データマイニング・
>    抽出を含む体系的／自動的なデータ収集」および「本サービスを他サービスの入力として
>    利用すること」を禁止しています。browser-use による自動操作はこれに該当し得ます
>    （違反時はコンテンツ／アカウント削除・アクセス制限の可能性、加えて bot 検知リスク）。
> 2. **公式に同等機能が存在。** 音声入力は公式アプリ **Speakly**、自律的な操作・
>    ワークフロー実行は公式の **Super Agent** が提供済みです。設計書 §7-第二は
>    「公式に同等の自動化機能があればそちらへ切り替えることを強く推奨」としており、
>    本実装はその指示に従います。
>
> → 本 MVP は **Genspark を自動操作しません。** ローカル音声認識 ＋ Gemini による
> 依頼文生成までを担い、最後は **ユーザーが手動で貼り付け／公式 Speakly を使う**
> 規約順守の受け渡し方式とします。

## できること

1. マイクで音声指示を録音（ローカル）
2. faster-whisper でテキスト化（ローカル・CPU・日本語対応）
3. Gemini（Flash-Lite 系）で指示を解釈し、校閲／画像質感向上などの
   **Genspark 向け依頼文**を生成
4. 内容を表示・確認したうえでクリップボードへコピー（自動送信はしない）

## アーキテクチャ（差し替え可能な構造）

設計書で要求された「判断エンジン／STT は差し替え可能に」を満たすため、
各段を抽象インターフェースにしています。

| 段 | 役割 | 既定実装 | 差し替え例 |
|---|---|---|---|
| `stt.py` | 音声認識 | `FasterWhisperSTT` | クラウド STT 実装を追加 |
| `brain.py` | 指示解釈 | `GeminiBrain` | ローカル LLM 実装を追加 |
| `handoff.py` | 受け渡し | クリップボード＋確認 | （公式機能の手動連携） |

## セットアップ

```bash
cd voice-genspark-agent
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # GEMINI_API_KEY を記入
```

Gemini API キーは https://aistudio.google.com/apikey で無料取得できます。

> Linux では音声入出力に PortAudio が必要です（例: `sudo apt-get install libportaudio2`）。

## 使い方

```bash
python main.py
```

Enter で録音開始 → もう一度 Enter で停止 → 認識結果と生成依頼文が表示 →
確認後にクリップボードへコピー → Genspark に貼り付けて実行。

### Windows: bat ファイルで一発起動

`start.bat` をダブルクリックすると、次を順に実行します。

1. 既定ブラウザで Genspark（`https://www.genspark.ai/`）を開く
2. 仮想環境 `.venv` を有効化（あれば）して `main.py` を起動

> Genspark を開くのは「ユーザーが手動でサイトを開く」のと同じ操作であり、
> 自動操作（規約で禁じられたスクレイピング等）には当たりません。
> ブラウザを開くだけにしたい場合は、bat の 2) 部分（`main.py` 起動行）を削れば
> 「Genspark を開くだけ」のランチャーになります。

## 設計書との対応

- §4.1 STT … faster-whisper（small/medium 切替・CPU・日本語）。クラウド STT へ差し替え可。
- §4.2 判断 … Gemini Flash-Lite 系（モデル名は `.env` で変更可）。ローカル LLM へ差し替え可。
- §4.3 操作 … **規約順守のため自動操作は不採用。** 公式 Speakly／Super Agent を推奨。
- §7-第二 … 本 README 冒頭の通り解決済み（公式機能へ寄せる方針）。
- §7-第三 … 判断エンジンを抽象化し差し替え可能に。
- §7-第四 … 受け渡し前に必ず確認ステップを挟む（自動送信なし）。

詳細な経緯と元設計・レビューは `DESIGN.md` を参照。
