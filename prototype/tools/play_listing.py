"""Upload the Google Play store listing (texts + icon, feature graphic, phone screenshots) through the Play Developer API.

Run by .github/workflows/play-listing.yml with the PLAY_SERVICE_ACCOUNT_JSON secret (the service account must have access to the
app in Play Console). Texts come from store-assets/android/listings/<lang>/, images from store-assets/android/images/.
"""
import json, os, sys
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

PACKAGE = 'uz.dentalexpert.app'
ROOT = Path(__file__).resolve().parent.parent / 'store-assets' / 'android'
LANGS = ['en-US', 'ru-RU']  # Play Console has no Uzbek store listing

creds = service_account.Credentials.from_service_account_info(json.loads(os.environ['PLAY_SERVICE_ACCOUNT_JSON']),
                                                              scopes=['https://www.googleapis.com/auth/androidpublisher'])
api = build('androidpublisher', 'v3', credentials=creds, cache_discovery=False)
edits = api.edits()
edit = edits.insert(packageName=PACKAGE, body={}).execute()['id']
print('edit', edit)


def mime(p: Path):
    return 'image/png' if p.suffix == '.png' else 'image/jpeg'


def upload(lang, kind, path):
    edits.images().upload(packageName=PACKAGE, editId=edit, language=lang, imageType=kind,
                          media_body=MediaFileUpload(str(path), mimetype=mime(path))).execute()
    print(f'  {kind}: {path.name}')


for lang in LANGS:
    d = ROOT / 'listings' / lang
    body = {'language': lang, 'title': (d / 'title.txt').read_text().strip(),
            'shortDescription': (d / 'short_description.txt').read_text().strip(),
            'fullDescription': (d / 'full_description.txt').read_text().strip()}
    edits.listings().update(packageName=PACKAGE, editId=edit, language=lang, body=body).execute()
    print(lang, 'texts ok')
    for kind in ('icon', 'featureGraphic', 'phoneScreenshots'):
        edits.images().deleteall(packageName=PACKAGE, editId=edit, language=lang, imageType=kind).execute()
    upload(lang, 'icon', ROOT / 'images' / 'icon-512.png')
    upload(lang, 'featureGraphic', ROOT / 'images' / lang / 'feature.png')
    for p in sorted((ROOT / 'images' / lang / 'phone').glob('*.jpg')):
        upload(lang, 'phoneScreenshots', p)

try:
    edits.commit(packageName=PACKAGE, editId=edit).execute()
except HttpError as e:
    # Apps with changes that need a manual "Send for review" in Play Console reject a plain commit.
    if 'changesNotSentForReview' not in str(e):
        raise
    edits.commit(packageName=PACKAGE, editId=edit, changesNotSentForReview=True).execute()
    print('committed without sending for review: press "Send for review" in Play Console when ready')
print('done')
