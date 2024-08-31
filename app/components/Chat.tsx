'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FaPaperPlane } from "react-icons/fa";
import { db } from '../firebase';
import { Timestamp, addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import OpenAI from "openai";
import LoadingIcons from 'react-loading-icons'
import path from "path";
import Recorder from './Recorder';


type Message = {
    text: string;
    sender: string;
    createdAt:Timestamp;
}



const Chat = () => {

    const openai = new OpenAI({
        apiKey:process.env.NEXT_PUBLIC_OPENAI_KEY,
        dangerouslyAllowBrowser:true,
    });
   
    const {selectedRoom,selectRoomName} = useAppContext();
    const [inputMessage, setInputMessage] = useState<string>("");
    const [messages,setMessages] = useState<Message[]>([]);
    const [isLoading,setIsLoading] = useState<boolean>(false);


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

    const sendMessage = async () => {
        if(!inputMessage.trim()) return;

        const messageData = {
            text:inputMessage,
            sender:"user",
            createdAt:serverTimestamp(),
        }

        //messageをfirestoreに保存
        const roomDocRef = doc(db, "rooms",selectedRoom!);
        const messageCollectionRef = collection(roomDocRef,"messages");
        await addDoc(messageCollectionRef,messageData);
       

        setIsLoading(true)

        const messagesToSend:any = messages.map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
            
        }))
    
        messagesToSend.push({role: "user", content: inputMessage});
        console.log("Sending the following messages to OpenAI:", messagesToSend); // デバッグログを出力

        //openaiからの返信
        const gpt4Response = await openai.chat.completions.create({
            messages:messagesToSend,
            model: "gpt-4-turbo-2024-04-09",
          });
          
          
          const botResponse = gpt4Response.choices[0].message.content;
          await addDoc(messageCollectionRef,{
            text:botResponse,
            sender:"bot",
            createdAt:serverTimestamp(),
          });
          

          //openaiの返信を音声に変換

          

          function speakText(botResponse:any) {
            if (!window.speechSynthesis) {
              alert("Sorry, your browser does not support text to speech!");
              return;
            }
          
            //音声
            const utterance = new SpeechSynthesisUtterance(botResponse);
            utterance.voice = speechSynthesis.getVoices().filter(voice => voice.lang === 'ja-JP')[0];
            // utterance.pitch = 1; // 音の高さ
            utterance.rate = 1.2; // 話す速度
      
            window.speechSynthesis.speak(utterance);
          }
          
          // 使用例
          speakText(botResponse);

          setIsLoading(false);
          setInputMessage("");
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

        <div className='flex-shrink-0 relative'>
            <input 
            type="text" 
            placeholder='send a message' 
            className='border-2 rounded w-full pr-10 focus:outline-none p-2'
            onChange={(e) => setInputMessage(e.target.value)}
            value={inputMessage}
            //onKeyDown={(e) => {
                //if(e.key === "Enter"){
                  //  sendMessage();
                //}
           // }}
            />
            {/* <buttonn className='absolute inset-y-0 right-4 flex items-center'
            onClick={()=> sendMessage()}></buttonn> */}
            <div className='absolute inset-y-0 right-4 flex items-center'
            onClick={sendMessage}>
            <FaPaperPlane />
            </div>

        </div>
    </div>
  )
}

export default Chat