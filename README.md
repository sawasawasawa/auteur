# Auteur

Become a content creator in 90 seconds.

Auteur takes a one-sentence description of who you are, writes three short-form video concepts ranked by hook strength, interviews you on the strongest one, picks the best 25 to 35 seconds of what you said, and renders a finished vertical short you can post.

Built for **Ralphthon Singapore 2026 / Impact Track**, in a single day.

## How it works

1. **Seed.** You describe yourself in one paragraph.
2. **Concepts.** Claude proposes three distinct video angles, each with a punchy hook and 4 interview questions.
3. **Interview.** You hit record and answer the questions out loud. 60 to 90 seconds.
4. **Cut.** Local Whisper transcribes with word-level timestamps. Claude picks the best 25 to 35 seconds and writes the hook overlay.
5. **Render.** Remotion renders a 1080x1920 captioned short with brand styling.
6. **Reveal.** You download the MP4.

End to end: about 90 seconds from "stop recording" to "download".

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 + Tailwind | Single deploy, fast prototyping |
| Backend | Next.js API routes (Node runtime) | No separate server, ngrok-able |
| Brain | Claude Sonnet via PAI Inference.ts | No API key needed (subscription billing) |
| STT | whisper.cpp + ggml-large-v3-turbo | Local, fast, word-level timestamps |
| Video render | Remotion 4 (programmatic API) | Real React-based 9:16 templating |
| Audio cuts | ffmpeg + atrim + loudnorm | Standard pipeline, 30ms fades |

No OpenAI dependency. No cloud video service. Anything that costs money already runs on the operator's machine.

## Run locally

Requires: Bun or Node 20+, pnpm, ffmpeg, whisper.cpp (`brew install whisper-cpp`), and Mateusz's PAI Inference.ts (or any CLI that returns Claude output).

```bash
pnpm install
cp .env.example .env.local
# point WHISPER_BIN, WHISPER_MODEL, PAI_INFERENCE at your local paths
pnpm dev
# open http://localhost:3000
```

To expose for the demo:

```bash
ngrok http 3000
# paste the ngrok URL into Vercel as NEXT_PUBLIC_API_BASE if you split deploys
```

## File map

```
src/
  app/
    page.tsx                 # Seed
    concepts/page.tsx        # Pick 1 of 3
    interview/page.tsx       # MediaRecorder
    render/page.tsx          # SSE phase log
    reveal/page.tsx          # 9:16 player + download
    api/
      seed/route.ts          # niche -> 3 concepts
      concept/route.ts       # session picks concept
      upload/route.ts        # audio blob -> kicks pipeline
      progress/[id]/route.ts # SSE channel
      session/[id]/route.ts  # debug + render path
  lib/
    inference.ts             # Claude via PAI Inference.ts shell-out
    whisper.ts               # whisper-cli word-level transcription
    ffmpeg.ts                # atrim + loudnorm cut and concat
    remotionRender.ts        # programmatic Remotion render
    pipeline.ts              # orchestrator
    sessions.ts              # in-memory store + EventEmitter for SSE
    schemas.ts               # zod validation
  remotion/
    index.ts
    Root.tsx
    Short.tsx                # 9:16 composition
```

## Ralphthon attribution

Everything in this repository was authored on 2026-05-17 during the Ralphthon Singapore window.

Reused open-source dependencies (declared, not "built today"):
- [Remotion](https://www.remotion.dev/) for video rendering
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) for transcription
- [Next.js](https://nextjs.org/), Tailwind, Zod, lucide-react

Built today and original work:
- All UI (`src/app/**`, components, styling)
- All backend logic (`src/lib/**`, API routes)
- Cut-decision prompt + JSON schema
- Concept-generation prompt + JSON schema
- 9:16 Remotion `Short` composition with hook / caption / palette system
- End-to-end orchestrator + SSE progress channel
- The product itself

## Judging criteria mapping

- **Live Demo (0 to 4):** Interview a judge on stage, ship a finished 9:16 short in under 90 seconds. Real, not pre-recorded.
- **Creativity / Originality (0 to 3):** Inverts the usual "creator records 30 takes" flow. The AI runs the interview, picks the take, writes the hook, lays the captions. Operator only speaks.
- **Impact Potential (0 to 3):** Every first-time creator gets stuck on idea + framing + edit. Auteur removes all three in one click. Real wedge for the 95 percent of would-be creators who never publish.

## Disqualified-category check

Auteur is not a basic RAG app, a Streamlit demo, an image analyzer, an education chatbot, a job screener, a nutrition coach, or a personality analyzer. It is a real-time creative-production pipeline that uses AI as the editor, not as the chat partner.

## License

MIT. See LICENSE.
