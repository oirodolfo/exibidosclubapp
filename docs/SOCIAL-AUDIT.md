# Social functionality — audit & mapping

**No code changes.** This document maps existing models and services for vertical feed and social features.

---

## 1. Existing models (Prisma)

| Domain concept | Prisma model | Notes |
|----------------|--------------|--------|
| **User** | `User` | id, email, name, image, profile, slugs, images, votes, swipes, followFrom/followTo, userBadges, etc. |
| **Post / feed item** | **`Image`** | No "Post" model. Feed content = **Image** (userId, storageKey, thumbKey, watermarkedKey, caption, visibility, moderationStatus, createdAt). |
| **Like** | **`Swipe`** | No "Like" model. Like = `Swipe` with `direction: "like"`. Also `dislike`, `skip`. Optional `categoryId` when direction=like. |
| **Comment** | **None** | No Comment model. Messaging exists (Conversation, Message) but no comments on images. |
| **Follow** | `Follow` | fromId, toId, status (pending \| accepted \| blocked). Unique (fromId, toId). |
| **Tag / Category** | `Category`, `Tag` | Category: parentId, name, slug, tags. Tag: categoryId, name, slug. ImageTag links Image↔Tag. |
| **Vote** | `Vote` | userId, imageId, tagId?, weight (1..5 or -1). Unique (userId, imageId, tagId). Per-image and per-tag voting. |

---

## 2. Image (feed item) — current fields

- **Ids & user:** id, userId  
- **Media:** storageKey, thumbKey, blurKey, watermarkedKey, mimeType, width, height  
- **Behavior:** visibility (public \| swipe_only), blurMode, blurSuggested, watermarkApplied  
- **Moderation:** moderationStatus, moderationNote  
- **Content:** caption, duplicateOfId, contentHash  
- **Timestamps:** createdAt, updatedAt, deletedAt  
- **Relations:** user, imageTags (→Tag), votes (→Vote), swipes (→Swipe), rankingSnapshots  

**Missing for vertical feed (to add in Stage 2):**

- `mediaType` — optional (e.g. image \| video); today all are image.  
- `mediaUrl(s)` — not stored; URLs are derived from storageKey/thumbKey via IMS/serve. Optional denorm URL field or keep deriving at API layer.  
- `rankingScore` — optional cached score for feed ordering (likes, comments, votes, recency).  

---

## 3. Indexes (existing)

- **Image:** userId, visibility, moderationStatus, createdAt, deletedAt, duplicateOfId, (userId, contentHash)  
- **Swipe:** userId, imageId, (userId, createdAt)  
- **Vote:** userId, imageId, tagId; unique (userId, imageId, tagId)  
- **Follow:** fromId, toId, status; unique (fromId, toId)  
- **Category / Tag:** parentId, slug, categoryId; ImageTag (imageId, tagId)  

**Missing for feed (Stage 2):**

- Index for feed ordering: e.g. (visibility, moderationStatus, deletedAt, createdAt) or (rankingScore DESC, createdAt DESC) if we add rankingScore.  

---

## 4. Reusable services & API

| Area | API routes | Hooks / usage |
|------|------------|----------------|
| **Feed** | `GET /api/swipe/feed` (cursor, limit) | `useSwipeFeed`, `useSwipeMutation` (like/dislike/skip) |
| **Follow** | POST /api/follow, POST unfollow, GET status, requests accept/reject | `useFollow`, `useUnfollow`, `useFollowRequests` |
| **Categories** | GET /api/categories, GET /api/categories/[slug]/tags | `useCategories` |
| **Images** | upload, serve, [id]/tags, [id]/votes | `useImageTags` |
| **Swipe** | POST /api/swipe (imageId, direction, categoryId?) | `useSwipeMutation` |
| **Rankings** | GET /api/rankings | — |

---

## 5. Gaps

- **Comment:** No model or API. For “reuse comment logic” we have nothing to reuse; add minimal Comment (imageId, userId, body, createdAt) in a later stage if required.  
- **Feed ordering:** Currently `createdAt desc`. No rankingScore; no index optimized for “trending” or “following”.  
- **Category follow:** Follow is user↔user only. No “follow category” — would require extending Follow or a minimal CategoryFollow.  
- **Notifications:** No notification model or delivery in schema; optional later.  
- **XP / levels:** No gamification fields on User; add optional xp/level in Stage 9.  

---

## 6. Backward compatibility

- Extend **Image** only with optional fields (mediaType, rankingScore); existing queries unchanged.  
- Keep **Swipe** as the only “like” signal; do not introduce a separate Like model.  
- Keep **Vote** (userId, imageId, tagId?, weight); one vote per user per image per tag.  
- Any new Comment model must be additive (Image.comments relation).  

---

*Next: Stage 2 — minimal model extensions (Image.mediaType, rankingScore, indexes).*
