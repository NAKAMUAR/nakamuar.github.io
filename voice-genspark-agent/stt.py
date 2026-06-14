"""音声録音と音声認識（STT）。

設計書 §4.1 に従い、STT は差し替え可能なインターフェースにしている。
既定は faster-whisper（ローカル・CPU・日本語）。クラウド STT に切り替えたい場合は
`SpeechToText` を継承した別実装を用意して main.py で差し替える。
"""
from __future__ import annotations

import queue
import sys

from config import config

# numpy / sounddevice は録音時のみ必要なため遅延 import にする
# （マイクやオーディオライブラリが無い環境でも本モジュールを import できるようにする）


def record_audio() -> "np.ndarray":
    """マイクから録音し、mono float32 波形を返す。

    RECORD_SECONDS > 0 なら固定秒数、0 なら Enter で開始/停止。
    """
    import numpy as np
    import sounddevice as sd

    sr = config.sample_rate

    if config.record_seconds > 0:
        print(f"🎤 {config.record_seconds:.0f} 秒録音します...")
        audio = sd.rec(
            int(config.record_seconds * sr),
            samplerate=sr,
            channels=1,
            dtype="float32",
        )
        sd.wait()
        return audio.flatten()

    # Enter で開始/停止するモード
    print("🎤 Enter キーで録音開始...")
    input()

    q: "queue.Queue[np.ndarray]" = queue.Queue()

    def callback(indata, frames, time, status):  # noqa: ARG001
        if status:
            print(status, file=sys.stderr)
        q.put(indata.copy())

    frames: list[np.ndarray] = []
    with sd.InputStream(
        samplerate=sr, channels=1, dtype="float32", callback=callback
    ):
        print("🔴 録音中... もう一度 Enter で停止")
        input()

    while not q.empty():
        frames.append(q.get())

    if not frames:
        return np.zeros(0, dtype="float32")
    return np.concatenate(frames, axis=0).flatten()


class SpeechToText:
    """STT の差し替え可能インターフェース（設計書 §4.1）。"""

    def transcribe(self, audio: np.ndarray) -> str:
        raise NotImplementedError


class FasterWhisperSTT(SpeechToText):
    def __init__(self) -> None:
        from faster_whisper import WhisperModel

        print(f"🧠 faster-whisper ({config.whisper_model}) をロード中...")
        self.model = WhisperModel(
            config.whisper_model,
            device=config.whisper_device,
            compute_type=config.whisper_compute_type,
        )

    def transcribe(self, audio: np.ndarray) -> str:
        if audio.size == 0:
            return ""
        segments, _ = self.model.transcribe(
            audio, language=config.stt_language, vad_filter=True
        )
        return "".join(seg.text for seg in segments).strip()
