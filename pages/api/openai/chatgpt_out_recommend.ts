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

  let content = `ユーザが質問クエリを思いつくことができずに困っています．調べていることに関して，以下のように回答してください
  例）
  ユーザ：ユーザの質問：ダークチョコレートの成分について教えて？
  答え：カカオが55%以上含まれたチョコレートのことです． 
  ユーザが回答に困っているので以下のように観点を提示してください．
  答え：ダークチョコレートの適切な摂取量について調べることができます．調べますか？
  
  \n\nユーザからのリクエスト: ${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: 'system', content: content }, ...formattedHistory],
  });

  const airesponse = response.choices[0].message?.content;



  res.status(200).json({ airesponse });
}