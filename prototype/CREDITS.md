# Image credits

Photographs bundled in the app (`src/photos/*.webp`). All are from Wikimedia Commons under licences that allow reuse with attribution: public domain, CC0, CC BY and CC BY-SA. Licences were read from each file page (API `extmetadata`) on 2026-10-24. Machine-readable list: `public/credits.json`; in the app: Profil > Image credits. Checked in CI by `tools/photo_credits_check.py`.

| File | Title | Author | Licence | Source | Modifications |
|---|---|---|---|---|---|
| `radio.webp` | Basic panoramic radiograph | Coronation Dental Specialty Group | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Basic_panoramic_radiograph.jpg) | resized to 1000px wide, converted to WebP |
| `ped.webp` | Deciduous teeth-boy-OPG-10,10,2019 | Gang65 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Deciduous_teeth-boy-OPG-10,10,2019.jpg) | resized to 1000px wide, converted to WebP |
| `endo.webp` | Endodontic Files 20-40 | Hanabishi | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Commons file page](https://commons.wikimedia.org/wiki/File:Endodontic_Files_20-40.JPG) | cropped, resized to 1000px wide, converted to WebP, contrast adjusted |
| `surg.webp` | Dental extraction forceps | Revolver00870 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Dental_extraction_forceps.jpg) | resized to 1000px wide, converted to WebP |
| `pros.webp` | Dental setup for implants | Coronation Dental Specialty Group | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Dental_setup_for_implants.jpg) | resized to 1000px wide, converted to WebP |
| `perio.webp` | Gingivitis | Roquex | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons file page](https://commons.wikimedia.org/wiki/File:Gingivitis.jpg) | resized to 1000px wide, converted to WebP |
| `impl.webp` | Implant overdenture model | Coronation Dental Specialty Group | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Implant_overdenture_model.jpg) | resized to 1000px wide, converted to WebP |
| `ortho.webp` | Orthopantomogram of severe dental crowding | Challiyan | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Orthopantomogram_of_severe_dental_crowding.jpg) | resized to 1000px wide, converted to WebP |
| `mfs.webp` | Human mandible mental protuberance | Petter Bøckman | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Human_mandible_mental_protuberance.jpg) | resized to 1000px wide, converted to WebP |
| `card.webp` | Dental Caries Cavity 2 (cropped) | Suyash.dwivedi | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Dental_Caries_Cavity_2_(cropped).JPG) | resized to 1000px wide, converted to WebP |
| `prev.webp` | Dentalni hygiena - pomucky | Milenafoto | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons file page](https://commons.wikimedia.org/wiki/File:Dentalni_hygiena_-_pomucky.jpg) | cropped (the two product labels at the left and right edges are cut away), resized to 1000px wide, converted to WebP |

Derivatives of CC BY-SA images (the crops and WebP conversions here) are shared under the same licence as the original.

# Question sources: Attestatsiya tayyorgarligi

The "Attestatsiya tayyorgarligi" (certification exam prep) section uses the public test-question PDFs ("TEST SINOVI SAVOLLARI", Uzbek and the official Russian editions) of the Medical Personnel Qualification Assessment Centre (Tibbiyot va farmatsevtika xodimlarining malakasini baholash markazi, tmbm.ssv.uz) for 12 dental specialties. Source URLs, retrieval dates and SHA-256 of every PDF: `data/attestation/manifest.json`.

- Shown in the app (Learn > Attestatsiya, and Profil > Image credits) in Uzbek and Russian only: "Savollar manbasi: Tibbiyot va farmatsevtika xodimlarining malakasini baholash markazi (tmbm.ssv.uz) ochiq test bazasi. Norasmiy tayyorgarlik vositasi; rasmiy imtihon bilan bog'liq emas. Javoblar kaliti avtomatik aniqlangan, xatolik haqida xabar bering."
- Not official, not endorsed. The site footer says all rights reserved; no permission was requested and the owner accepted the risk. **Contact / removal request: davlatsudekspert@gmail.com** (also shown in the app). Kill switches: `VITE_ATTESTATION_ENABLED=0` at build time (the question files are then not bundled) and `ATTESTATION_ENABLED=0` on the server (the app hides the section after asking `/api/attestation/status`).
- Wording is not rewritten; only mechanical spelling fixes (typos, missing o'/g' marks, x/h, spacing) with the untouched text kept in `src`. The answer key (first option) is checked in `data/attestation/AUDIT.md`: questions with doubtful keys are `review: true` and never served; specialties whose key assumption fails are withheld.
