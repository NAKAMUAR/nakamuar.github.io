"""Genspark への受け渡し。

設計方針（README / DESIGN の §0 参照）に基づき、安全な最大ラインを採る:

    入力（依頼文）は自動化してよいが、
      (a) 送信（Enter / 送信ボタン）は必ず人が押す
      (b) 出力（結果テキスト・画像）は自動取得しない（人が画面で読む）

具体的な受け渡しは次の順で行う:
  1. 内容を表示し、ユーザーの承認を得る（設計書 §7-第四 安全策）
  2. 依頼文をクリップボードへコピー
  3. （任意）Genspark をブラウザで開く
  4. （任意・AUTO_PASTE）チャット欄が前面にある前提で Ctrl+V まで自動入力
  5. 送信は行わない。ユーザーが内容を確認して送信ボタンを押す。
"""
from __future__ import annotations

import webbrowser

from config import config

try:
    import pyperclip

    _HAS_CLIP = True
except Exception:  # pyperclip 未導入/未対応環境
    _HAS_CLIP = False


def _auto_paste() -> bool:
    """アクティブウィンドウに Ctrl+V を送る（送信はしない）。成功で True。"""
    try:
        import time

        import pyautogui  # type: ignore
    except Exception:
        print("ℹ️  AUTO_PASTE 有効ですが pyautogui が無いため手動貼り付けにします。")
        return False

    print(f"⌨️  {config.paste_delay:.0f} 秒後に貼り付けます。"
          "Genspark のチャット欄をクリックして前面にしてください...")
    time.sleep(config.paste_delay)
    # 修飾キーは 'ctrl'。macOS は 'command'。
    import sys

    mod = "command" if sys.platform == "darwin" else "ctrl"
    pyautogui.hotkey(mod, "v")  # 貼り付けのみ。Enter は送らない。
    return True


def handoff_to_genspark(result: dict) -> None:
    prompt = result.get("genspark_prompt", "")
    summary = result.get("summary", "")

    print("\n" + "=" * 60)
    print(f"📋 タスク種別 : {result.get('task_type')}")
    print(f"📝 確認       : {summary}")
    print("-" * 60)
    print(prompt)
    print("=" * 60)

    if not prompt:
        print("（依頼文が空のため受け渡しをスキップします）")
        return

    ans = input("この依頼文を Genspark に渡しますか？ [y/N] ").strip().lower()
    if ans != "y":
        print("⏭  スキップしました。")
        return

    # 2. クリップボードへコピー
    if _HAS_CLIP:
        pyperclip.copy(prompt)
        print("✅ 依頼文をクリップボードにコピーしました。")
    else:
        print("ℹ️  pyperclip が無いため、上記の依頼文を手動でコピーしてください。")

    # 3. ブラウザで Genspark を開く
    if config.open_in_browser:
        webbrowser.open(config.genspark_url)
        print(f"🌐 {config.genspark_url} を開きました。")

    # 4. （任意）貼り付けまで自動化
    pasted = False
    if config.auto_paste and _HAS_CLIP:
        pasted = _auto_paste()

    # 5. 送信は人の操作
    print("-" * 60)
    if pasted:
        print("📨 チャット欄に貼り付けました。内容を確認し、"
              "あなたの操作で送信ボタンを押してください。")
    else:
        print("📨 チャット欄に貼り付け(Ctrl+V)し、内容を確認のうえ、"
              "あなたの操作で送信ボタンを押してください。")
    print("   ※ 送信は自動では行いません（安全のため人が確認して送信）。")
