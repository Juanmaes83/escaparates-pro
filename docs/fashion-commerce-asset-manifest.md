# Fashion Commerce PRO Asset Manifest

Date: 2026-07-17

This manifest follows the definitive asset-gate unblock for PR #26.

## Policy

- CloudFront MP4 files are classified as `approved-by-owner`.
- Unsplash images are non-blocking and classified as `approved-unsplash`.
- RandomUser portraits must not be copied or redistributed. They are marked `replacement-authorized` and will be replaced before implementing the designers/influencers block.
- `pending-metadata` is allowed while PR #26 remains Draft.

## Current Strategy

The first functional block keeps the authorized CloudFront URLs remote instead of committing large MP4 files to Git. This preserves the source visual experience and avoids duplicating heavy media without a performance reason.

The machine-readable manifest lives at:

`assets/templates/fashion-commerce/rubik-sota/asset-manifest.json`

## First Block Assets

| Asset | Source | Usage | Status | Strategy |
|---|---|---|---|---|
| `heroVideo` | CloudFront | Hero video | `approved-by-owner` | Remote authorized URL |
| `campaignVideo1-4` | CloudFront | Video grid | `approved-by-owner` | Remote authorized URL |
| `heroPoster` | Unsplash | Hero poster | `approved-unsplash` | Remote URL |
| `product1Primary-product8Primary` | Unsplash | Gallery cards | `approved-unsplash` | Remote URL |
| `logo` | User slot | Optional logo | `pending-metadata` | Empty fallback |

## Deferred Assets

Designer and influencer portraits are not implemented in this first block. When that block is added, RandomUser URLs from the source must be replaced with owned, synthetic, or otherwise authorized portraits while preserving count, crop, aspect ratio, placement, and editorial function.
