import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_SECRET_KEY,
});

export async function POST(req: NextRequest) {
    const { userPrompt } = await req.json();

    if(!userPrompt) {
        return new Response(JSON.stringify({error: "No prompt provided"}), {
            status: 400
        });
    }

    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: userPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
    })

    return new Response(JSON.stringify({ data: response.data }));
};