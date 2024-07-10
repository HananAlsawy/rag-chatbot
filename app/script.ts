import { data } from "./data";
import { createEmbedding, generateRandomId, pcIndexName, pc, pcIndex } from "./utils.server.js";

const listIndexes = await pc.listIndexes();
const namesOflistIndexes = listIndexes?.indexes?.map((index) => index.name) || [];
// check if index already exists
if (namesOflistIndexes.includes(pcIndexName)) {
  await pc.createIndex({
    name: pcIndexName,
    dimension: 1536, // default dimension for text-embedding-ada-002
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });
}

for (const record of data) {
  const id = generateRandomId();
  const embeddings = await createEmbedding({ input: record.content });
  if (embeddings) {
    await pcIndex.upsert([
      {
        id: id,
        values: embeddings,
        metadata: {
          url: record.URL,
          title: record.title,
          description: record.description,
          content: record.content,
        },
      },
    ]);
  }
}
const stats = await pcIndex.describeIndexStats();
console.log(stats); // print index stats to the console
