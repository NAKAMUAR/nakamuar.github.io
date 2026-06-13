"""指示解釈（エージェントの頭脳）。

設計書 §4.2 / §7-第三 に従い、判断エンジンは差し替え可能なインターフェースにしている。
既定は Gemini（Flash-Lite 系・無料枠想定）。ローカル LLM に切り替えたい場合は
`Brain` を継承した別実装を用意して main.py で差し替える。

なお当初設計の browser-use 連携は規約上の懸念から採用していないため（README 参照）、
このモジュールの役割は「音声指示を Genspark 向けの最適な依頼文に変換する」ことに限定する。
"""
from __future__ import annotations

import json

from config import config

SYSTEM_PROMPT = """あなたは音声指示を解釈し、AI ワークスペース「Genspark」で実行するための
最適な依頼文（プロンプト）を組み立てるアシスタントです。
音声をテキスト化した指示を受け取り、次の JSON だけを返してください。

{
  "task_type": "proofread" | "image_enhance" | "other",
  "genspark_prompt": "Genspark にそのまま貼り付けられる、明確で具体的な依頼文",
  "summary": "ユーザーへの一行確認メッセージ（日本語）",
  "needs_confirmation": true
}

- proofread: 文章校閲・推敲。元の文章の意図を保ちつつ、依頼内容を明確化する。
- image_enhance: 画像の質感向上（nano-banana 等）。何をどう良くしたいかを具体化する。
- other: 上記以外。
余計な説明やコードフェンスは付けず、JSON のみを出力してください。"""


class Brain:
    """判断エンジンの差し替え可能インターフェース（設計書 §4.2 / §7-第三）。"""

    def interpret(self, instruction: str) -> dict:
        raise NotImplementedError


class GeminiBrain(Brain):
    def __init__(self) -> None:
        from google import genai

        if not config.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY が未設定です（.env を確認してください）")
        self.client = genai.Client(api_key=config.gemini_api_key)
        self.model = config.gemini_model

    def interpret(self, instruction: str) -> dict:
        from google.genai import types

        resp = self.client.models.generate_content(
            model=self.model,
            contents=instruction,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        text = (resp.text or "").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # 解釈に失敗しても止めず、指示をそのまま手渡しできるようフォールバック
            return {
                "task_type": "other",
                "genspark_prompt": instruction,
                "summary": "解釈に失敗したため指示をそのまま使用します",
                "needs_confirmation": True,
            }
