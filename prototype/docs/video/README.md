# Dental Expert: tanishtiruv roliklari

- `overview` — umumiy tanishtiruv (~77 s), 3 til subtitri × 2 format (16:9, 9:16) × 2 ko‘rinish (krem / ko‘k).
- `reel` — qisqa reel (~30 s), 9:16, uchala til subtitri birga, 2 ko‘rinish.
- Hamma ekran ilovaning haqiqiy skrinshoti (`video_studio/capture.py`), hech narsa chizilmagan. Audio inglizcha (ochiq Kokoro TTS, bepul).
- Manba: `video_studio/` (storyboards.py, tts.py, capture.py, studio.html, render.py, qa.py, docs_pack.py). Qayta yig‘ish: `python3 video_studio/capture.py`, `tts.py overview reel`, `render.py <video> <til> <wide|tall> <mono|color>`.
- Tekshiruv natijasi: `QA_SUMMARY.md`. Da’vo jadvali: `<video>/CLAIMS_AND_EVIDENCE.md`.
