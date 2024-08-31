import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type, text, history = [] } = req.body;

  const formattedHistory = history.map((item: { role: string; content: string }) => ({
    role: item.role,
    content: item.content,
  }));

  //let content = `あなたの名前はサリーです.女子高生ぽく話してください．\n\nそして，必ず最後に他の調べる観点を1つ追加してください．
  //\n\nおよそ150文字で手短にユーザからの質問に答えてください．\n\nユーザからのリクエスト: ${text}`;

  const content = `
  ########
  ユーザから質問があった時以下のように答えてください.
  例：ユーザの質問：ダークチョコレートの成分について教えて？
  答え：カカオが55%以上含まれたチョコレートのことです． ダークチョコレートの適切な摂取量について調べることができます．調べますか？
  このように，端的に短くユーザの質問に応答し，さらに調べていることに関する他の観点を提案してください．
  ##########
  ユーザからのリクエスト${text}`


//   if (type === 'recommendation') {
//     content += "\n\n最後に観点の推薦をしてください。";
//   }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: 'system', content: content }, ...formattedHistory],
  });

  const airesponse = response.choices[0].message?.content;
  res.status(200).json({ airesponse });
}