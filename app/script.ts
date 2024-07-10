import { data } from "./data";
import { createEmbedding, generateRandomInt, pcIndexName, pc, pcIndex } from "./utils.server.js";

const listIndexes = await pc.listIndexes();
const namesOflistIndexes = listIndexes?.indexes?.map((index) => index.name) || [];
if (namesOflistIndexes.includes(pcIndexName)) {
  await pc.createIndex({
    name: pcIndexName,
    dimension: 1536,
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
  const id = generateRandomInt();
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
console.log(stats);
