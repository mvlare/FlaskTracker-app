# Plan: Import Picture Sampling Sheet (Gemini OCR)

## Context

The sampling sheet at `/sampling/[headerId]` already has a working "Paste clipboard spreadsheet" flow that:
- Reads TSV text from clipboard
- Parses it via `parsePasteText()` into `PasteRow[]` state
- Shows a preview table (green = matched flask, amber = unmatched)
- Submits matched rows through the `pasteImport` server action

The new feature adds an OCR path: user selects a photo of a sampling sheet → image goes directly from browser to Gemini API → response TSV feeds through the **identical** `parsePasteText()` → same preview table and `confirmImport()` are reused. No new server action, no schema changes.

API key is stored in localStorage (user-managed). This keeps Vercel at zero serverless usage.

---

## How to get a Gemini API key

Go to **https://aistudio.google.com/app/apikey**, sign in with a Google account, click "Create API key". The free tier (Gemini 2.0 Flash) is sufficient — as of 2025 it allows ~1500 requests/day for free with no billing required.

> Note: The spec references "Gemini 3.1 Flash" — that model does not exist. The correct free-tier model is `gemini-2.0-flash`.

---

## Files to create

| File | Purpose |
|---|---|
| `src/lib/utils/gemini-ocr.ts` | All Gemini logic: key helpers + `ocrSamplingSheet()` |
| `src/lib/components/sampling/GeminiKeyModal.svelte` | Modal to enter/save/clear API key in localStorage |

## Files to modify

| File | Changes |
|---|---|
| `src/routes/sampling/[headerId]/+page.svelte` | New imports, 3 state vars, 1 new function, 3 new UI elements |
| `package.json` | Add `@google/genai` to dependencies |

---

## Step 1 — Install package

```bash
npm install @google/genai
```

(`@google/genai` v1.x — browser-compatible, ESM, works with Vite directly.)

---

## Step 2 — Create `src/lib/utils/gemini-ocr.ts`

Exports:
- `GEMINI_API_KEY_STORAGE_KEY` — constant `'flasktracker_gemini_api_key'`
- `getGeminiApiKey(): string` — reads from localStorage (returns `''` on SSR)
- `setGeminiApiKey(key: string): void` — writes to localStorage
- `ocrSamplingSheet(file: File, apiKey: string): Promise<string>` — calls Gemini, returns TSV or throws with user-readable message

Key details:
- Model: `gemini-2.0-flash`
- Delivery: `inlineData` base64 (no File API upload needed for photos)
- Prompt asks for 12-column TSV (no header), empty fields as empty tabs, sentinel `NO_TABLE_FOUND` if no table visible
- SDK init: `new GoogleGenAI({ apiKey })` constructed per-call (avoids stale key)

---

## Step 3 — Create `src/lib/components/sampling/GeminiKeyModal.svelte`

Simple password-input modal. Imports `getGeminiApiKey`/`setGeminiApiKey` from `gemini-ocr.ts`.

Props: `onclose: () => void`

- On mount: pre-fills input from localStorage
- "Save key" button calls `setGeminiApiKey()`, shows "Saved!" for 1.5s
- "Clear" button wipes the key
- Link to `aistudio.google.com/app/apikey`
- Styled like existing admin modals

---

## Step 4 — Modify `+page.svelte`

### 4a. Imports (line 5)
Add `Image, Key` to lucide-svelte import.  
Add: `import { ocrSamplingSheet, getGeminiApiKey } from '$lib/utils/gemini-ocr';`  
Add: `import GeminiKeyModal from '$lib/components/sampling/GeminiKeyModal.svelte';`  
Add: `import { onMount } from 'svelte';`

### 4b. New state vars (after line 108 — after `pasteFormEl`)
```ts
let showKeyModal = $state(false);
let isOcring = $state(false);
let ocrFileInput: HTMLInputElement | undefined = $state();
let geminiKeyConfigured = $state(false);

onMount(() => { geminiKeyConfigured = !!getGeminiApiKey(); });
```

### 4c. New function `importFromImage()` (after `readClipboard()`, before `confirmImport()`)
```ts
async function importFromImage() {
  const file = ocrFileInput?.files?.[0];
  if (!file) return;
  pasteError = ''; pasteRows = []; isOcring = true; showPaste = true;
  try {
    const tsv = await ocrSamplingSheet(file, getGeminiApiKey());
    pasteRows = parsePasteText(tsv);
    if (pasteRows.length === 0) pasteError = 'No rows recognised in OCR output.';
  } catch (err) {
    pasteError = err instanceof Error ? err.message : 'OCR failed.';
  } finally {
    isOcring = false;
    if (ocrFileInput) ocrFileInput.value = '';
  }
}
```

### 4d. Header bar (after line 233 — after existing "Paste clipboard spreadsheet" button)
Add separator `|`, then:
- **"Import picture sampling sheet" button** — `onclick={() => ocrFileInput?.click()}`, disabled while `isOcring`, uses `<Image>` icon
- **Key settings button** — `onclick={() => showKeyModal = true}`, uses `<Key>` icon, green if `geminiKeyConfigured` else amber
- **Hidden file input** — `bind:this={ocrFileInput}`, `type="file"`, `accept="image/*"`, `onchange={importFromImage}`

### 4e. Inside paste panel (after the "Read clipboard" button, line ~255)
Add OCR spinner:
```svelte
{#if isOcring}
  <p class="mt-2 text-xs text-gray-500 animate-pulse">Sending image to Gemini OCR…</p>
{/if}
```

### 4f. Bottom of template (before closing `</div>`)
```svelte
{#if showKeyModal}
  <GeminiKeyModal onclose={() => { showKeyModal = false; geminiKeyConfigured = !!getGeminiApiKey(); }} />
{/if}
```

---

## Code reuse summary

- `parsePasteText()` — reused as-is (OCR result is TSV, same format)
- `parseDateToISO()` / `parseTimeToHHMM()` — reused via `parsePasteText()`
- Preview table HTML — reused as-is (same `pasteRows` state)
- `confirmImport()` / `pasteImport` server action — reused as-is
- No duplication with clipboard path; OCR path only adds a new way to populate `pasteRows`

---

## Error handling

| Scenario | Feedback |
|---|---|
| No API key | "No Gemini API key configured. Click the key icon to set it." |
| Bad key / quota exceeded | SDK error message forwarded to `pasteError` |
| Image has no table | "No sampling table found in the image." |
| Rows parsed but no flask matched | "No rows recognised in OCR output." |
| Network failure | SDK error message forwarded to `pasteError` |

---

## Verification

1. `npm install` completes without errors
2. Dev server starts (`npm run dev`)
3. Key icon (amber) appears in sampling sheet header → click → modal opens → paste key → Save → icon turns green
4. Click "Import picture sampling sheet" → file picker opens → select a photo of a sampling sheet → spinner appears → preview table populates with TSV rows
5. Matched rows show green, unmatched amber → click "Import N row(s)" → data saved (same as clipboard flow)
6. Paste clipboard flow still works unchanged
7. TypeScript check passes (`npx tsc --noEmit`)

---

## Status & Blockers (as of 2026-05-31)

**Feature is on hold.**

### Why: Google AI Studio blocked in the EEA

The original plan uses the Gemini API via Google AI Studio. However, Google AI Studio is officially unavailable in the European Economic Area (EEA) — including the Netherlands — due to GDPR and local data protection regulations. Attempting to access `aistudio.google.com` from a Dutch IP redirects to Google's "Available Regions" page.

A VPN workaround was considered but **rejected**: this app is used by a Dutch university (government institution) and must remain within Google's Terms of Service.

### Alternative paths when resuming

| Option | Notes |
|---|---|
| **B — OpenAI GPT-4o Vision** (preferred) | Fully EEA-compliant. Same client-side architecture, same localStorage key approach, same `parsePasteText()` reuse. Replace `@google/genai` with `openai` SDK. Pay-per-image (~$0.001–0.003). |
| **C — Google Vertex AI** | EEA-compliant (Google Cloud). Supports Gemini models. Requires billing + GCP project + server-side calls via Vercel, which reintroduces serverless cost concerns. More complex. |

### Recommended next step

Resume with **Option B (OpenAI GPT-4o)**. The plan above stays largely the same — only the SDK, model name, and API key source change. The entire `parsePasteText()` / preview table / `confirmImport()` pipeline is unaffected.
