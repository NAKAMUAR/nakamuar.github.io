"""設定の一元管理。.env から読み込む。"""
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass
class Config:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    whisper_model: str = os.getenv("WHISPER_MODEL", "small")
    whisper_device: str = os.getenv("WHISPER_DEVICE", "cpu")
    whisper_compute_type: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    stt_language: str = os.getenv("STT_LANGUAGE", "ja")
    sample_rate: int = int(os.getenv("SAMPLE_RATE", "16000"))
    record_seconds: float = float(os.getenv("RECORD_SECONDS", "0"))

    # 受け渡し（handoff）設定
    genspark_url: str = os.getenv("GENSPARK_URL", "https://www.genspark.ai/")
    open_in_browser: bool = _as_bool(os.getenv("OPEN_IN_BROWSER", "true"))
    # 貼り付け(Ctrl+V)まで自動化するか。送信は絶対に自動化しない。
    auto_paste: bool = _as_bool(os.getenv("AUTO_PASTE", "false"))
    paste_delay: float = float(os.getenv("PASTE_DELAY", "4"))


config = Config()
