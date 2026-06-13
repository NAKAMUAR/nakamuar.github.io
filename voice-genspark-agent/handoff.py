"""Genspark への受け渡し。

設計書 §7-第二（規約）への対応として、ヘッドレス自動操作は行わない。
生成した依頼文をクリップボードへコピーし、ユーザーが Genspark（または公式の
Speakly 音声入力）へ貼り付ける方式とする。
設計書 §7-第四（安全性）への対応として、受け渡し前に必ず確認を挟む。
"""
from __future__ import annotations

try:
    import pyperclip

    _HAS_CLIP = True
except Exception:  # pyperclip 未導入/未対応環境
    _HAS_CLIP = False


def handoff_to_genspark(result: dict) -> None:
    prompt = result.get("genspark_prompt", "")
    summary = result.get("summary", "")

    print("\n" + "=" * 60)
    print(f"📋 タスク種別 : {result.get('task_type')}")
    print(f"📝 確認       : {summary}")
    print("-" * 60)
    print(prompt)
    print("=" * 60)

    if _HAS_CLIP and prompt:
        ans = input("この依頼文をクリップボードにコピーしますか？ [y/N] ").strip().lower()
        if ans == "y":
            pyperclip.copy(prompt)
            print("✅ コピーしました。Genspark のチャット欄に貼り付けて実行してください。")
        else:
            print("⏭  コピーをスキップしました。")
    else:
        print("ℹ️  上記の依頼文を手動で Genspark に貼り付けてください。")
