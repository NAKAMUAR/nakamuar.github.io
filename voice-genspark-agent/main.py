"""音声操作 Genspark アシスタント（規約順守版 MVP）のエントリポイント。

パイプライン: 録音 → STT（ローカル）→ Gemini で依頼文生成 → 確認のうえ受け渡し。
Genspark の自動操作は行わない（README の経緯を参照）。
"""
from __future__ import annotations

from brain import GeminiBrain
from handoff import handoff_to_genspark
from stt import FasterWhisperSTT, record_audio


def main() -> None:
    stt = FasterWhisperSTT()
    brain = GeminiBrain()

    print("\n=== 音声操作 Genspark アシスタント（規約順守版）===")
    print("Ctrl+C で終了\n")

    try:
        while True:
            audio = record_audio()
            text = stt.transcribe(audio)
            if not text:
                print("（音声を認識できませんでした）\n")
                continue

            print(f"🗣  認識: {text}")
            result = brain.interpret(text)
            handoff_to_genspark(result)
            print()
    except KeyboardInterrupt:
        print("\n終了します。")


if __name__ == "__main__":
    main()
