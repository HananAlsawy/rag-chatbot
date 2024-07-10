import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@remix-run/node";
import OpenAI from "openai";

export const generateRandomId = () => {
  let randomId = "";
  for (let i = 1; i <= 9; i += 1) {
    randomId += Math.floor(Math.random() * 10);
  }
  return randomId;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
export const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
export const pcIndexName = "quickstart-index";
export const pcIndex = pc.index(pcIndexName);

const getCompletePromptWithContext = async ({ prompt }: { prompt: string }) => {
  const queryEmbedding = await createEmbedding({ input: prompt });
  const queryResponse = await pcIndex.query({ vector: queryEmbedding || [], topK: 3, includeMetadata: true });
  const queryContext = queryResponse?.matches?.map((match) => match.metadata?.content) || [""];
  const promptStart = "Answer the question based on the context below.\n\n" + "Context:\n";
  const promptEnd = `\n\nQuestion: ${prompt}\nAnswer:`;
  const completePrompt = promptStart + `"\n\n---\n\n"${queryContext.join(" ")}` + promptEnd;
  return completePrompt;
};

export const chatCompletion = async ({ prompt }: { prompt: string }) => {
  try {
    const completePrompt = await getCompletePromptWithContext({ prompt });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: completePrompt }],
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
    return response.data[0].embedding;
  } catch (error: any) {
    console.log({ error });
    return null;
  }
};
