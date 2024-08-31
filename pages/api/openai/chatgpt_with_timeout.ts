import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, history = [] } = req.body;

  const formattedHistory = history.map((item: { role: string; content: string }) => ({
    role: item.role,
    content: item.content,
  }));

  let content = `あなたは情報検索ができる万能なAIロボットです. およそ150文字で手短にユーザからの質問に答えてください．
  ユーザからのリクエスト: ${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: 'system', content: content }, ...formattedHistory],
  });

  const airesponse = response.choices[0].message?.content;

  res.status(200).json({ airesponse });
}
