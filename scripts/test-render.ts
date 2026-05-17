import { renderShort } from "../src/lib/remotionRender";

const out = "/tmp/auteur-smoke/test-render.mp4";
const start = Date.now();
try {
  await renderShort({
    audioPath: "audio/test.wav",
    durationSec: 24.5,
    hook: "TEST RENDER",
    beats: [
      { start: 0, end: 5, text: "HELLO WORLD" },
      { start: 5, end: 10, text: "TESTING REMOTION" },
      { start: 10, end: 20, text: "WORKS LIKE A CHARM" },
      { start: 20, end: 24.5, text: "DONE" },
    ],
    outPath: out,
    brand: "AUTEUR",
  });
  console.log(`RENDER OK in ${((Date.now() - start) / 1000).toFixed(1)}s -> ${out}`);
} catch (e: any) {
  console.error("RENDER FAIL:", e?.stack || e);
  process.exit(1);
}
