import { NextResponse } from "next/server";

function wavFromPcm(base64Pcm: string, sampleRate = 24000) {
  const pcm = Buffer.from(base64Pcm, "base64");
  const header = Buffer.alloc(44);
  const dataSize = pcm.length;
  const fileSize = 36 + dataSize;

  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

function findAudioData(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  if (typeof record.data === "string") return record.data;
  if (
    record.output_audio &&
    typeof record.output_audio === "object" &&
    typeof (record.output_audio as Record<string, unknown>).data === "string"
  ) {
    return (record.output_audio as Record<string, string>).data;
  }
  if (
    record.outputAudio &&
    typeof record.outputAudio === "object" &&
    typeof (record.outputAudio as Record<string, unknown>).data === "string"
  ) {
    return (record.outputAudio as Record<string, string>).data;
  }

  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findAudioData(item);
        if (found) return found;
      }
    } else {
      const found = findAudioData(child);
      if (found) return found;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice API is not configured." },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    text?: unknown;
  } | null;
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
  const voice = process.env.GEMINI_TTS_VOICE || "Callirrhoe";
  const prompt = [
    "Read this as Mira, a warm professional interview coach.",
    "Use a clear, calm, encouraging voice with natural pacing.",
    "Keep it polished and human, not theatrical.",
    `Transcript: ${text.slice(0, 1800)}`,
  ].join("\n");

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: { type: "audio" },
      generation_config: {
        speech_config: [{ voice }],
      },
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: "Mira voice generation failed." },
      { status: response.status },
    );
  }

  const audioData = findAudioData(result);
  if (!audioData) {
    return NextResponse.json(
      { error: "Mira voice did not return audio." },
      { status: 502 },
    );
  }

  return new NextResponse(wavFromPcm(audioData), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    },
  });
}
