import { NextRequest, NextResponse } from "next/server";

const JINNY_URL = "https://jinny-five.vercel.app/generate";

export async function POST(request: NextRequest) {
    const body = await request.json();

    const upstream = await fetch(JINNY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
}

// BODY FORMAT: 
// const body: { prompt: string; images?: string[]; system_prompt?: string } = {
// prompt: promptWithHistory,
// images: images.length > 0 ? attachedFiles.filter(f => f.status === "done").map(f => f.uploadedUrl as string) : undefined,
// system_prompt: SYSTEM_PROMPT,
// };