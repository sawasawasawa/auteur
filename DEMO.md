# Auteur / 3-minute demo script

Demo slot: 3 minutes live + 1 to 2 minutes Q&A.
Strategy: hybrid theater. Pre-recorded "this is the product" reel for the first 30 seconds, then ONE live moment (interview a judge volunteer) that produces a finished short on stage.

## Beat sheet

| t | What's on screen | What Mateusz says | Risk |
|---|---|---|---|
| 0:00 to 0:08 | Auteur home page on stage screen. Tagline visible. | "I built Auteur to answer a single question: why do 95 percent of would-be creators never publish? The answer is the same three things every time. Idea, framing, edit. Watch." | None |
| 0:08 to 0:30 | Type a seed: "AI hackathon judge in Singapore who would secretly love to start a podcast." Click generate. Show three concepts appearing. | "I tell Auteur who I am. It writes three video concepts, ranked. I pick one." | LLM latency cap 12s. Fallback: switch to pre-generated session id. |
| 0:30 to 0:50 | Pick the strongest concept. Show interview questions. | "Now it interviews me." Invite the judge to come up. "Want a podcast? Stand here. 60 seconds. Just answer the questions." | Judge declines. Fallback: a teammate stands in. |
| 0:50 to 1:55 | Judge speaks into the lavalier. Big timer on screen. | Mateusz silent. Lets the judge talk. | Audio clip / mic feedback. Fallback: kill recording at 60s. |
| 1:55 to 2:05 | Hit stop. Render page loads. Phase pills illuminate. | "Local Whisper transcribes. Claude picks the best 30 seconds. Remotion renders. About a minute." | SSE stalls. Fallback: trigger pre-rendered short for same session id. |
| 2:05 to 2:50 | Render progress. Mateusz narrates over it. | "No OpenAI key. No cloud render. Everything runs on this laptop. The brain is Claude via the subscription. The ears are whisper.cpp. The render is Remotion. Built today, MIT, public repo at github.com/sawasawasawa/auteur." | None |
| 2:50 to 3:00 | Reveal page autoplays the short in a phone frame. Audience sees the judge's own short. | "Here's the short. They can post it tonight. That is the wedge." | Render unfinished. Fallback: cut to /public/fallback.mp4. |

## Pre-show checklist

- [ ] `pnpm dev` running on laptop
- [ ] ngrok tunnel up if external URL needed (`ngrok http 3000`)
- [ ] Lavalier mic plugged in, levels tested
- [ ] Screen mirrored to stage
- [ ] iPhone propped as backup camera
- [ ] One pre-recorded session warm in browser (sessionId hard-coded as backup) so I can fall to it with one keypress
- [ ] /public/fallback.mp4 already rendered
- [ ] Volume up but not deafening

## Recovery moves

| Failure | Move |
|---|---|
| LLM call to /api/seed times out | Switch tab to pre-warmed session URL |
| MediaRecorder permission denied | Use iPhone, AirDrop the audio file, upload via /api/upload manually |
| Whisper hangs | Already have transcript cached for the warm session, swap to that |
| Remotion render fails | Cut to /public/fallback.mp4 in the phone-frame player |
| Judge talks for over 90 seconds | Auto-stop at 90s, run anyway |
| Stage Wi-Fi dies | Everything is local. The ngrok URL is only for the judges' phones; on stage we hit localhost direct |

## Q&A prep

- "Why no OpenAI?" Because the rules say Impact Track makes Codex optional. Claude was the right tool for the cut-decision step (better at long structured JSON). The judge gets a 5-second technical win.
- "Could this be a real product?" Yes. The wedge is the 30 to 60 percent of creators who never publish because the edit is the bottleneck. The pricing model is per-short ($1) or unlimited subscription ($19). The moat is the cut-decision prompt + the trained taste.
- "Why not use Premiere or CapCut?" Because they require taste. Auteur supplies the taste. The creator only speaks.
- "What about copyright on the captions?" The captions are verbatim from the creator's own audio. Zero risk.
- "How long did this take?" One Ralph Loop. About 4 hours of human time, plus an autonomous agent loop in the middle.
