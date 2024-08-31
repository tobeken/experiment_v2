'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FaPaperPlane } from "react-icons/fa";
import { db } from '../firebase';
import { Timestamp, addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import OpenAI from "openai";
import LoadingIcons from 'react-loading-icons'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'
import { useStopwatch } from 'react-timer-hook'
import Active from '../../img/active.gif'
import NonActive from '../../img/notactive.png'
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MicRecorder = require('mic-recorder-to-mp3')


type Message = {
    text: string;
    sender: string;
    createdAt:Timestamp;
}

type HistoryItem = {
  role: 'user' | 'bot';
  content: string;
};



const Chat = () => {
   
    const {selectedRoom,selectRoomName} = useAppContext();
    const [inputMessage, setInputMessage] = useState<string>("");
    const [messages,setMessages] = useState<Message[]>([]);
    const [messageHistory,setMessageHistory] =useState<HistoryItem[]>([]);
    const [transcript, setTranscript] = useState('')
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [isLoading,setIsLoading] = useState<boolean>(false);
    const [recording, setRecording] = useState(false);
    const [prompt, setPrompt] = useState('')
    const router = useRouter()

    const recorder = useRef<typeof MicRecorder>(null);

    const { seconds, minutes, start, pause, reset } = useStopwatch({
        autoStart: false,
      })

      useEffect(() => {
        // インスタンス作成
        recorder.current = new MicRecorder({ bitRate: 128 })
      }, [])


    //各ルームのメッセージを取得する
    useEffect(() => {
        if(selectedRoom){
            const fetchMessages = async () => {
                const roomDocRef = doc(db,"rooms",selectedRoom);
                const messageCollectionRef = collection(roomDocRef,"messages")
                const q = query(messageCollectionRef, orderBy("createdAt"));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const newMessages = snapshot.docs.map((doc) => doc.data() as Message);
                    setMessages(newMessages)
                
                });
    
            return () => {
                unsubscribe();
            };
            };
    
            fetchMessages();
        }

    },[selectedRoom])

    //音声録音開始
    const startRecording = async() => {
        reset();

        await recorder.current
        .start()
        .then(() => {
            setRecording(true)
        })
        .catch((error:string) => {
            console.error(error)
        })
    }

    //音声録音ていし
    const stopRecording = async() => {
        pause()

        await recorder.current
        .stop()
        .getMp3()
        .then(([buffer, blob]: any) => {

        const file = new File(buffer, 'audio.mp3', {
            type: blob.type,
            lastModified: Date.now(),
          })
          // 録音停止
          setIsLoading(true)
          setAudioFile(file)
        })
        .catch((error: string) => {
          console.log(error)
          setIsLoading(false)
        })
  
      // 録音停止
      setRecording(false)
     
    }

    useEffect(() => {
        const fn = async () => {
          try {
            if (audioFile) {
              // 送信データ
              const formData = new FormData()
              formData.append('file', audioFile)
    
              // Whisper API
              const response = await fetch('/api/openai/whisper', {
                method: 'POST',
                body: formData,
              })
              
              const response_data = await response.json()
              console.log("レスポンスデータ:", response_data);
    
              // 音声認識チェック
              if (response_data.transcript) {
                // console.log("トランスクリプト:", response_data.transcript); // トランスクリプトのログ出力
                setTranscript(response_data.transcript)
             
              }else {
                // console.log("トランスクリプトが返却されませんでした。"); // トランスクリプトがない場合のログ
              }
            }
          } catch (error) {
            alert(error)
            setIsLoading(false)
          }
          setAudioFile(null)
        }
    
        fn()
      }, [audioFile])
    
      useEffect(() => {
        if (transcript) {
          // 送信
          sendMessage();
        } else {
          setIsLoading(false)
        }
      }, [transcript])
      



    //送信メッセージか
    const sendMessage = async () => { //transcriptなし
        setIsLoading(true)
        
        //console.log(`trascript data ${transcript}`)
        
        try{
          if(transcript) {
            //const inputMessage = transcript

            //messeageテーブルに追加

            const messageData = {
              text:transcript, //inputMessageでなくても良さそう
              sender:"user",
              createdAt:serverTimestamp(),
          }
  
          //messageをfirestoreに保存
          const roomDocRef = doc(db, "rooms",selectedRoom!);
          const messageCollectionRef = collection(roomDocRef,"messages");
          await addDoc(messageCollectionRef,messageData);
          }

          //キャッシュクリア
          router.refresh()

          //送信データ
          const body = JSON.stringify({ text : transcript})
          console.log(body)

          //chatGPT API
          const response = await fetch('/api/openai/chatgpt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          })

          const response_data = await response.json()
          const botres = response_data.airesponse
         
         // console.log(`aiからの返答${response_data.airesponse}`);


          if(botres) {
            // messageCollectionRef を再定義
            const roomDocRef = doc(db, "rooms", selectedRoom!);
            const messageCollectionRef = collection(roomDocRef, "messages");
            
            await addDoc(messageCollectionRef, {
              text: botres, // または、期待される応答変数をここに設定
              sender: "bot",
              createdAt: serverTimestamp(),
            });

          //chatGPT TTS
          const body = JSON.stringify({ text : botres})
          const response = await fetch('/api/openai/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          })
          if(!response.ok){throw new Error('レスポンスがネットワーク問題により再生できません．')};

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          audio.play();


          }

        }catch(error){
          console.log(error)

        }

        setPrompt('')
        setTranscript('')
        setIsLoading(true)
            
    }

  return (
    <div className='bg-gray-200 h-full flex flex-col p-4'>
        <h1 className='text-2xl text-slate-500 font-semibold mb-4'>{selectRoomName}</h1>
        <div className='flex-grow overflow-y-auto mb-4'>
            {messages.map((message,index) => (
                
                <div key={index} className={message.sender === "user" ? "text-right" : "text-left"}>
                    <div className={message.sender === "user" ? 'bg-blue-500 inline-block rounded px-4 py-2 mb-2' : 'bg-slate-500 inline-block rounded px-4 py-2 mb-2'}>
                        <p className='text-white'>{message.text}</p>
                    </div>
                </div>

            ))}
            {isLoading &&  <LoadingIcons.TailSpin />}


        </div>
{/* footer form */}


        <div className='flex justify-center'>
        <div className="w-[60px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <StopIcon className="h-7 w-7 text-white" />
              </div>
              <div className="text-white font-bold">
                <span>{('0' + minutes).slice(-2)}</span>:<span>{('0' + seconds).slice(-2)}</span>
              </div>
            </div>
          ) : recording ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">

                <StopIcon className="h-7 w-7 cursor-pointer text-white" onClick={stopRecording} />
              </div>
              <div className="text-white font-bold">
                <span>{('0' + minutes).slice(-2)}</span>:<span>{('0' + seconds).slice(-2)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
   
                
                <MicrophoneIcon
                  className="h-7 w-7 cursor-pointer text-gray-700"
                  onClick={startRecording}
                />
              </div>
              <div className="text-white font-bold">00:00</div>
            </div>
          )}
        </div>


        </div>
    </div>
  )
}

export default Chat