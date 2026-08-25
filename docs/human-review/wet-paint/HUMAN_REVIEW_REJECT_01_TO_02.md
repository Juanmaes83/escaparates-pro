# HUMAN REVIEW REJECT — 01 ORIGINAL → 02 PAINTERLY

**Date:** 2026-08-22  
**Product authority:** Juanma  
**Implementation branch:** `claude/museum-itinerant-living-art-graft-v1`  
**Last reviewed implementation commit:** `cd4473968b70349851ef8a6e5ca312f6f2ce2ae3`  
**Donor:** `Juanmaes83/wet-paint-flow` @ `0b9ba9a5be665f3a2a8b2450945ec5006e61e2de`  
**Status:** ❌ HUMAN REJECT / PRODUCT NOT WORKING YET

## Why this is rejected

Automated QA reported 14,000 strokes, zero critical page errors and a working reprocess path, but the real Human Review does **not** demonstrate the required product behavior.

The human test shows that loading/changing the source in the Museum does not reliably produce the corresponding Wet Paint result in the `02 PAINTERLY` artwork. A previously generated/default image can remain visible in another artwork slot, while the newly selected `01 ORIGINAL` source is not visibly transformed into the expected `02 PAINTERLY` result.

Therefore:

> **PLAYWRIGHT PASS ≠ PRODUCT PASS.**

The current implementation must not be considered solved, approved or mergeable.

## Single objective

Make this exact chain work visibly and repeatedly inside Museum:

`NEW USER FILE → 01 ORIGINAL → actual current source image → painterly-adapter → real wet-paint donor pipeline → 02 PAINTERLY`

No other objective is allowed until this passes Human Review.

## Mandatory A → B acceptance test

The fix is accepted only if the same running Museum session passes this sequence without page reload:

1. Upload **IMAGE A** into `01 ORIGINAL`.
2. Confirm `01 ORIGINAL` visibly contains IMAGE A.
3. Confirm `02 PAINTERLY` becomes the Wet Paint transformation of **IMAGE A** — not a default scene, not a stale prior texture, not another artwork slot.
4. Upload a clearly different **IMAGE B** into `01 ORIGINAL`.
5. Confirm `01 ORIGINAL` visibly changes to IMAGE B.
6. Confirm `02 PAINTERLY` visibly replaces A with the Wet Paint transformation of **IMAGE B**.
7. Confirm `01 ORIGINAL` remains intact and is not overwritten by the processed output.
8. Confirm no unrelated artwork slot receives the source or painterly output by default.

If `02 PAINTERLY` still shows A after B is uploaded, or shows a donor/default image, **FAIL**.

## Debug mission for Claude

Continue from the current branch. **Do not restart from zero.** Preserve the Museum seam and the literal donor port already present unless evidence proves one specific seam is wrong.

Trace the runtime identity of the source through every step:

`Studio upload/File → ARTWORK_IMAGE handling → entity.itinerant.original material.map → texture.image identity → painterly-adapter source detection → processImage(current image) → pipeline uploadedTexture → output texture → entity.itinerant.painterly material.map`

Instrument this path temporarily if needed. The goal is to prove, for A and then B, that the exact current source object/file reaches the pipeline and that the exact new output texture is assigned only to `entity.itinerant.painterly`.

Pay special attention to:

- stale `material.map` references;
- `lastOriginalMap` comparison and whether the upload path mutates an existing Texture instead of replacing the Texture object;
- Canvas-backed textures whose `.image` object stays identical while canvas pixels change;
- asynchronous image decoding / upload timing;
- reprocessing firing before the new image is actually readable;
- source/output entity IDs or artwork plate lookup returning the wrong plate;
- a previous/default source surviving inside the donor pipeline;
- output target reuse or stale GPU texture contents;
- accidental assignment to the third artwork slot;
- observer/polling logic that detects object identity but not content revision.

## Hard constraints

- DO NOT work on `Living`.
- DO NOT work on `Combined`.
- DO NOT add new visual features.
- DO NOT rewrite Wet Paint again.
- DO NOT replace the donor pipeline with a new custom painterly engine.
- DO NOT refactor the general Museum architecture.
- DO NOT touch `main` / `master`.
- DO NOT merge.
- DO NOT delete the protected/working Museum versions.

## Required evidence before asking Juanma to review again

Claude must provide:

1. exact commit SHA;
2. exact files changed and why;
3. a real local/review URL;
4. automated test of **A → B in one session**;
5. visual evidence showing A in `01` and A-painted in `02`, then B in `01` and B-painted in `02`;
6. confirmation that artwork slot 03 is untouched unless explicitly selected;
7. console/network errors, if any;
8. explicit statement of the root cause found — not just symptoms.

Only after those conditions are met does Juanma perform Human Review and decide `KEEP / ADJUST / REJECT`.

## Video evidence

The Human Review videos are the canonical visual evidence for this rejection. They should be attached to the GitHub issue/PR or stored alongside this document when the binary files are available to the GitHub execution environment. They were not embedded in this Markdown commit because the current connector invocation does not have their binary payload.

## Definition of done

**Done means only this:** Juanma can upload any new image into `01 ORIGINAL` and visibly see that same image become the Wet Paint result in `02 PAINTERLY`; then upload a second different image and see `02` update to that second image, in the same session, with no stale/default output and no spill into slot 03.
