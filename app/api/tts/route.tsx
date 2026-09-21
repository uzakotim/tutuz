import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.text || typeof body.text !== "string") {
            return Response.json(
                { error: "text is required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            "https://uzbek-tts-api.vercel.app/api/tts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: body.text,
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            return Response.json(
                {
                    error: "TTS service failed",
                    details: errorText,
                },
                { status: response.status }
            );
        }

        const audio = await response.arrayBuffer();

        return new Response(audio, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": audio.byteLength.toString(),
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("TTS error:", error);

        return Response.json(
            { error: "Failed to generate speech" },
            { status: 500 }
        );
    }
}