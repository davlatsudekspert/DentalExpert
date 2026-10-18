# Google Play: App access (instructions for the reviewer)

Play Console → **App content → App access → All or some functionality in my app is restricted → Add instructions**.

The app requires sign-in, and normal sign-in uses a one-time code sent by email. Google's reviewer has no access to
your mailbox, so use the **store-review accounts** that the server already supports (`functions/_lib/review.ts`):
listed addresses sign in with one fixed 6-digit code and no email is sent. They can never be admins.

## 1. Turn the review accounts on (Cloudflare, once)

Cloudflare dashboard → Workers & Pages → **dental-expert** → Settings → Variables and Secrets (Production) → add two
**secrets**, then redeploy (Deployments → Retry):

| Name | Example value |
|---|---|
| `REVIEW_ACCOUNTS` | `reviewer-dentist@review.invalid:dentist,reviewer-teacher@review.invalid:teacher,reviewer-student@review.invalid:student` |
| `REVIEW_CODE` | any 6 digits you invent, e.g. `482913` (do not reuse it anywhere else) |

Check it yourself in the Play build: sign in with `reviewer-dentist@review.invalid` and the code.

## 2. Instructions to paste in Play Console

Add one instruction set per account (or one set with all three addresses in "Any other information"):

- **Name:** Dentist review account
- **Username / email:** `reviewer-dentist@review.invalid`
- **Password:** the `REVIEW_CODE` digits
- **Any other information:**

```
Sign-in uses a one-time email code. For review accounts the code is fixed and no email is sent.
1. Open the app, choose a language, tap "Create account" (or "Already have an account? Sign in").
2. Enter reviewer-dentist@review.invalid and request the code.
3. Enter the 6-digit code given in the Password field.
Teacher view: reviewer-teacher@review.invalid, student view: reviewer-student@review.invalid (same code).
Learning content, the 3D tooth atlas and daily practice are on the Learn and Atlas tabs.
This Android build is the education edition: no patient records, no dentist search and no booking. No payments, no ads.
```

Keep the two secrets in place for as long as the app is on Play: reviewers check updates as well.
