import { useState, useEffect, useRef } from "react";
import { json, useActionData, Form, useSubmit } from "@remix-run/react";
import OpenAI from "openai";
import { ActionFunction, MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Chatbot with RAG" }];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const prompt = formData.get("prompt") as string;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
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

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const actionData = useActionData<{ response: string | null }>();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData && !!actionData.response) {
      setMessages((prev) => [...prev, { role: "assistant", content: actionData.response as string }]);
    }
  }, [actionData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setPrompt("");
    submit({ prompt }, { method: "post" });
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-w-md w-full mx-auto">
      <div className="bg-blue-500 text-white p-4 rounded-t-lg text-center">
        <h1 className="text-xl font-semibold">Chatbot</h1>
      </div>
      <div className="p-4 h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block p-2 my-2 rounded-lg ${
                msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <Form className="flex p-4 bg-gray-50 border-t" method="post" onSubmit={handleSubmit}>
        <input
          type="text"
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-l-lg"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-lg">
          Send
        </button>
      </Form>
    </div>
  );
}
