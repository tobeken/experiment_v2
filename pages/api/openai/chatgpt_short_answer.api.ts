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

  let content = `
  あなたは情報検索ができる万能なAIロボットです. ユーザからの相談や質問に答えてください．
  相談があった場合，次の形式に沿って答えてください．
  例：
  ユーザの質問：英語が上手くなりたいのですが，どうしたらいい？
  答え：英語が上手くなる方法は４つあります．１つ目は，洋画を見ることです．字幕と合わせてみることで英語力が向上します．他の方法について知りたいですか？
  このように，全ての解決方法の要約を言わないようにしてください．そして，一つ一つ知りたいかを確認しながら答えてください．

  また，リストアップをお願いされた場合でも，一つずつ答えてください．
  例:
    ユーザの質問：山口の観光地をリストアップしてください．
  答え：3つあります．１つ目は，錦帯橋です．他の場所について知りたいですか？
  このように，全てを言わないようにしてください．そして，一つ一つ知りたいかを確認しながら答えてください．
  
  相談，リストアップ以外の場合は，要約して短い応答を心がけてください．
  
  \n\nユーザからのリクエスト: ${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: 'system', content: content }, ...formattedHistory],
  });

  const airesponse = response.choices[0].message?.content;



  res.status(200).json({ airesponse });
}