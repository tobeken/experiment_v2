import OpenAI from "openai";
import fs from "fs";
import path from "path";

import type { NextApiRequest, NextApiResponse } from 'next'

const openai = new OpenAI({
    apiKey:process.env.NEXT_PUBLIC_OPENAI_KEY,
   
});

export default async function handler(req:NextApiRequest,res:NextApiResponse){
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
      }
    try{
        const text = req.body.text;

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        })
            // 音声データをBufferとして取得
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // クライアントに音声データを返す
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);

    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

