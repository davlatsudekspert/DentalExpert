# QA summary

Checked on the finished files by `video_studio/qa.py`. Not checked: the English voice-over was not listened to by a person; uz/ru subtitle wording and the dental content were not reviewed by a native speaker or an expert (`NEEDS_NATIVE_REVIEW`, `EXPERT_REVIEW_REQUIRED`).


## Files

| File | Size | Length | Audio | LUFS | Peak dBFS |
|---|---|---|---|---|---|
| overview_en_tall_color.mp4 | 19.3 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_en_tall_mono.mp4 | 18.2 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_en_wide_color.mp4 | 17.7 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_en_wide_mono.mp4 | 16.0 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_ru_tall_color.mp4 | 20.8 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_ru_tall_mono.mp4 | 19.8 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_ru_wide_color.mp4 | 18.9 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_ru_wide_mono.mp4 | 16.9 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_uz_tall_color.mp4 | 19.9 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_uz_tall_mono.mp4 | 19.0 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_uz_wide_color.mp4 | 18.3 MB | 77.2 s | yes | -16.7 | -5.2 |
| overview_uz_wide_mono.mp4 | 16.6 MB | 77.2 s | yes | -16.7 | -5.2 |
| reel_uz_tall_color.mp4 | 6.4 MB | 29.6 s | yes | -16.5 | -5.4 |
| reel_uz_tall_mono.mp4 | 6.0 MB | 29.6 s | yes | -16.5 | -5.4 |

## Text checks

- Forbidden words (toifa / bank / банк) in subtitles, docs, storyboards and file names: **0** 
- Store / price / tariff words in subtitles and docs: **3** hits [('../docs/video/README.md', 'bepul'), ('../docs/video/overview/CLAIMS_AND_EVIDENCE.md', 'Yuklab ol'), ('storyboards.py', 'Yuklab ol')] (each reviewed: see note)
- ASCII apostrophe after o/g in Uzbek subtitles: **0**

## Subtitle speed (characters per second)

- overview_en_tall_color.srt: 19 cues, max 14.1 cps, 0 cues above 17 cps
- overview_en_tall_mono.srt: 19 cues, max 14.1 cps, 0 cues above 17 cps
- overview_en_wide_color.srt: 19 cues, max 14.1 cps, 0 cues above 17 cps
- overview_en_wide_mono.srt: 19 cues, max 14.1 cps, 0 cues above 17 cps
- overview_ru_tall_color.srt: 19 cues, max 15.2 cps, 0 cues above 17 cps
- overview_ru_tall_mono.srt: 19 cues, max 15.2 cps, 0 cues above 17 cps
- overview_ru_wide_color.srt: 19 cues, max 15.2 cps, 0 cues above 17 cps
- overview_ru_wide_mono.srt: 19 cues, max 15.2 cps, 0 cues above 17 cps
- overview_uz_tall_color.srt: 20 cues, max 15.3 cps, 0 cues above 17 cps
- overview_uz_tall_mono.srt: 20 cues, max 15.3 cps, 0 cues above 17 cps
- overview_uz_wide_color.srt: 20 cues, max 15.3 cps, 0 cues above 17 cps
- overview_uz_wide_mono.srt: 20 cues, max 15.3 cps, 0 cues above 17 cps
- reel_uz_tall_color.srt: 6 cues, max 14.9 cps, 0 cues above 17 cps
- reel_uz_tall_mono.srt: 6 cues, max 14.9 cps, 0 cues above 17 cps

## Result

All automatic checks passed.
