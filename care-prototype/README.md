# Care Prototype

Clickable prototype for the Care app (Uber-style private doctor booking in London).

## Run

Open `index.html` directly in a browser, or run a local server:

```bash
cd care-prototype
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Included flows

- Patient: onboarding → browse doctors → booking → Apple Pay mock → confirmation
- Doctor: onboarding → GMC check mock → pricing → availability → online status
