"""スモークテスト: 依存（マイク/API/ブラウザ）無しでパイプライン配線を検証する。

STT と Brain は差し替え可能インターフェースのスタブ実装に置き換え（設計書 §4.1/§4.2 の
「差し替え可能」構造の実証）、handoff は実物を使う（ブラウザ起動は OPEN_IN_BROWSER=false で抑止）。
faster-whisper / Gemini API / マイク / ブラウザが無い環境でも実行できる。

実行: echo y | python selftest.py
"""
from __future__ import annotations

import os

# ブラウザ・自動貼り付けは検証環境では使わない
os.environ.setdefault("OPEN_IN_BROWSER", "false")
os.environ.setdefault("AUTO_PASTE", "false")

from brain import Brain  # noqa: E402  差し替え可能インターフェース
from handoff import handoff_to_genspark  # noqa: E402  実物
from stt import SpeechToText  # noqa: E402  差し替え可能インターフェース

SAMPLE_INSTRUCTION = "この文章を校閲して。誤字脱字と読みやすさを直してほしい。"


class StubSTT(SpeechToText):
    """マイク無し環境用。固定テキストを返す。"""

    def transcribe(self, audio) -> str:  # noqa: ANN001, ARG002
        return SAMPLE_INSTRUCTION


class StubBrain(Brain):
    """API キー無し環境用。Gemini を呼ばず決め打ちの解釈を返す。"""

    def interpret(self, instruction: str) -> dict:
        return {
            "task_type": "proofread",
            "genspark_prompt": (
                "次の文章を校閲してください（誤字脱字の修正と読みやすさの改善。"
                "意味は変えないこと）。\n\n" + instruction
            ),
            "summary": "文章の校閲依頼として処理します",
            "needs_confirmation": True,
        }


def main() -> None:
    stt = StubSTT()
    brain = StubBrain()

    print("=== スモークテスト（マイク/API/ブラウザ無しで配線確認）===")
    text = stt.transcribe(None)
    print(f"🗣  (stub STT) 認識: {text}")
    result = brain.interpret(text)
    handoff_to_genspark(result)
    print("\n✅ パイプライン配線 OK（録音→STT→解釈→受け渡しの流れが通った）")


if __name__ == "__main__":
    main()
