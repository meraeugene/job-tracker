import { NextResponse } from "next/server";

const elevenLabsBaseUrl = "https://api.elevenlabs.io/v1/text-to-speech";
const defaultElevenLabsVoiceId = "XrExE9yKIg1WjnnlVkGX";
const defaultElevenLabsModelId = "eleven_flash_v2_5";
const defaultElevenLabsOutputFormat = "mp3_44100_128";
const allowedMiraVoiceIds = new Set([
  "EXAVITQu4vr4xnSDxMaL",
  "XrExE9yKIg1WjnnlVkGX",
  "pFZP5JQG7iQjIQuC4Bku",
]);

async function speakWithElevenLabs(text: string, selectedVoiceId?: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const voiceId =
    selectedVoiceId && allowedMiraVoiceIds.has(selectedVoiceId)
      ? selectedVoiceId
      : process.env.ELEVENLABS_VOICE_ID || defaultElevenLabsVoiceId;
  const modelId =
    process.env.ELEVENLABS_MODEL_ID || defaultElevenLabsModelId;
  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT || defaultElevenLabsOutputFormat;
  const url = `${elevenLabsBaseUrl}/${voiceId}?output_format=${outputFormat}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text.slice(0, 1800),
      model_id: modelId,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Mira voice generation failed with ElevenLabs." },
      { status: 503 },
    );
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    text?: unknown;
    voiceId?: unknown;
  } | null;
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  const voiceId =
    typeof payload?.voiceId === "string" ? payload.voiceId.trim() : undefined;

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  return speakWithElevenLabs(text, voiceId);
}
