---
name: Host-authoritative Firebase Realtime Database transport pattern
description: How to structure a client-side-authoritative multiplayer game (no server functions) over Firebase RTDB + anonymous auth, for static hosting (e.g. GitHub Pages).
---

Pattern used for a serverless, static-hostable real-time multiplayer game where one player's browser (the table host) is the sole source of truth.

**Why:** No server functions are available (static hosting), but private per-player data (e.g. hidden hand/cards) must not be readable by other clients, and only one client should ever run game logic to avoid divergent state.

**How to apply:**
- RTDB layout: `/tables/{code}/public` (everyone-visible state, no private data), `/tables/{code}/private/{uid}` (per-player private data, readable only by that uid), `/tables/{code}/intents/{uid}` (write-only-by-owner action requests), `/tables/{code}/emotes/{uid}` (ephemeral, owner-writable).
- Only the host client (matched by `public.hostId === auth.uid`) runs the game engine and writes to `/public` and any `/private/*`; every other client only ever writes its own `/intents/{uid}` and reads `/public` + its own `/private/{uid}`.
- Security rules enforce this split at the DB level (read of `/public` open to any authenticated user, read of `/private/{uid}` restricted to `auth.uid === $uid`, write of `/public`/`/private/*` restricted to the stored hostId, write of `/intents/{uid}`/`/emotes/{uid}` restricted to matching uid).
- Honest limitation to document: this protects against casual snooping by normal players, not against a technically malicious host who modifies their own client — there is no way to fully sandbox the host without real server-side functions.
- Anonymous auth UID is the stable per-player identity across reconnects/reloads; a non-host rejoining just re-subscribes to `/public` and its own `/private/{uid}` by that same uid.
