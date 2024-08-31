import OpenAI from "openai";

import type { NextApiRequest, NextApiResponse } from 'next'
const openai = new OpenAI({
    apiKey:process.env.NEXT_PUBLIC_OPENAI_KEY,
   
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {

      
      //console.log(`bodyの中身確認:${req.body.text}`)
      const text = req.body.text
      const history = req.body.history || [];

      // 履歴データをChatGPT APIが理解できる形式に変換
      const formattedHistory = history.map((item:{ role: string; content: string }) => ({
              role: item.role,
              content: item.content,
            }));
      
      //console.log(`aiに送信:${req.body.history}`)
      // ChatGPT
      const content = `あなたは情報検索ができる万能なAIロボット「ヤマトくん」です. およそ150文字で手短にユーザからの質問に答えてください．ユーザからのリクエスト${text}`
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-2024-04-09",
        messages: [{ role: 'system', content: content },...formattedHistory],
      })

  
      // レスポンスを返す
      const airesponse = response.choices[0].message?.content
     // console.log(`AIからの回答${airesponse}`) 
  
      res.status(200).json({ airesponse })
    } catch (error) {
      console.error(error)
      res.status(500).send('Something went wrong')
    }
  }
