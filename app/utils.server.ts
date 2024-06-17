import { json } from "@remix-run/node";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatCompletion = async ({ prompt }: { prompt: string }) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    return json({ response: response.choices[0].message?.content });
  } catch (error: any) {
    console.error({ error });
    return json({ error: error.message }, { status: 500 });
  }
};

export const createEmbedding = async ({ input }: { input: string }) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input,
    });
    return json({ embedding: response.data[0].embedding });
  } catch (error: any) {
    console.error({ error });
    return json({ error: error.message }, { status: 500 });
  }
};
