import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File } from 'formidable'
import fs from 'fs'

const openai = new OpenAI({
    apiKey:process.env.NEXT_PUBLIC_OPENAI_KEY,
   
});


const form = formidable({ multiples: true, keepExtensions: true })

const isFile = (file: File | File[]): file is File => {
  return !Array.isArray(file) && file?.filepath !== undefined
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const fileContent: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (files.file && isFile(files.file)) {
          // ファイルパスとサイズをログに出力
          resolve(fs.createReadStream(files.file.filepath))
        }

        return reject('file is not found')
      })
    })

        // ここでファイルのストリームが開始されていることを確認
        console.log('File stream has started.');

    // Whisper
  
    const response = await openai.audio.transcriptions.create({
        file:fileContent,
        model:"whisper-1",
        response_format: "text",
        })
        //console.log("Whisper API レスポンス:", response);
    const transcript = response
    res.status(200).json({ transcript })
   
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'サーバー側でエラーが発生しました。' });
  }
}
