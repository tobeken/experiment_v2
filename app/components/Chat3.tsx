'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FaPaperPlane } from "react-icons/fa";
import { db } from '../firebase';
import { Timestamp, addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp,getDocs, runTransaction, Transaction, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import OpenAI from "openai";
import LoadingIcons from 'react-loading-icons'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'
import { useStopwatch } from 'react-timer-hook'
import { useRouter } from 'next/navigation';
import { setDoc, getDoc } from 'firebase/firestore';
import Survey from './Survey';
import { storage } from '../firebase';
import { ref, uploadBytes } from 'firebase/storage';


const MicRecorder = require('mic-recorder-to-mp3')


type Message = {
    text: string;
    sender: string;
    createdAt:Timestamp;
    queryTime?: number | null; 
}

type HistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};


  // ユーザ音声録音開始
let startTime: Timestamp | null = null;
//ユーザ音声録音終了
let endTime: Timestamp | null = null;

//ボット音声録音終了
let botStartTime: Timestamp | null = null;

//ボット音声録音終了
let botEndTime: Timestamp | null = null;

//ボット音声終了後〜ユーザ録音開始の時間
let queryTime: number | null = null;





const Chat = () => {
   
    const {selectedRoom,selectRoomName,userId,showTasks,setShowTasks,currentTask,completedTasks,setCompletedTasks} = useAppContext();
    const [inputMessage, setInputMessage] = useState<string>("");
    const [messages,setMessages] = useState<Message[]>([]);
    const [history,setHistory] =useState<HistoryItem[]>([]);
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

    const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
    const [isCountdownActive, setIsCountdownActive] = useState<{ [key: string]: boolean }>({});
    const [hasStarted, setHasStarted] = useState<{ [key: string]: boolean }>({});
    const [isRecordingDisabled, setIsRecordingDisabled] = useState(false);
    //const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
    const [isBotResponding,setIsBotResponding] = useState(false);
    const [searchEnd, setSearchEnd] = useState<{ [key: string]: boolean }>({});
    const [autoRecommendCalled,setAutoRecommendCalled] = useState(false);
    const [autoRecommendTimer, setAutoRecommendTimer] = useState<NodeJS.Timeout | null>(null);
    const [isRecording, setIsRecording] = useState(false); // 録音中の状態を管理
    const [searchEnded, setSearchEnded] = useState(false); // 検索終了状態を管理
    const [isSurveyVisible, setIsSurveyVisible] = useState<{ [key: string]: boolean }>({});
    const [userData, setUserData] = useState<any>(null);
    const [roomName, setRoomName] = useState<string>('');
    const [calledWithTimeout, setCalledWithTimeout] = useState(false);
    const [allTasksCompleted, setAllTasksCompleted] = useState(false);


   

    //const searchEndedRef = useRef(false);
    //const audioRef = useRef<HTMLAudioElement | null>(null); // Audioオブジェクトを管理


    // ローカルストレージから完了状態を読み込む
    useEffect(() => {
        const storedCompletedTasks = localStorage.getItem('completedTasks');
        // if (storedCompletedTasks) {
        //     setCompletedTasks(JSON.parse(storedCompletedTasks));

        // }
        // if (storedCompletedTasks !== null) {
        //   const tasks = JSON.parse(storedCompletedTasks);
        //   // 全てのタスクが完了しているかチェック
        //   const allCompleted = Object.keys(tasks).length > 0 && Object.values(tasks).every(status => status);
        //   setAllTasksCompleted(allCompleted);
        if (storedCompletedTasks !== null) {
          const tasks = JSON.parse(storedCompletedTasks);
          // 期待する全てのタスクのリスト
          const expectedTasks = ["事前タスク", "タスク1", "タスク2", "タスク3"];
          // 全ての期待するタスクがcompletedTasksに含まれているか、かつ全てtrueであるかチェック
          const allCompleted = expectedTasks.every(task => tasks.hasOwnProperty(task) && tasks[task] === true);
          setAllTasksCompleted(allCompleted);
        }
        // }
        
    }, []);

    // 完了状態をローカルストレージに保存する
    useEffect(() => {
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }, [completedTasks]);

      useEffect(() => {
        // インスタンス作成
        recorder.current = new MicRecorder({ bitRate: 128 })
      }, [])

    //   useEffect(() => {
    //     // アンケートの状態をlocalStorageから読み込む
    //     const survey1Completed = localStorage.getItem('アンケート1');
    //     const survey2Completed = localStorage.getItem('アンケート2');
    //     const survey3Completed = localStorage.getItem('アンケート3');
    //     const finalSurveyCompleted = localStorage.getItem('最終アンケート');
    
    //     // 特定のアンケートがlocalStorageに存在しない場合、アンケート画面を表示する
    //     if (!survey1Completed || !survey2Completed || !survey3Completed || !finalSurveyCompleted) {
    //         setIsSurveyVisible(prev => ({ ...prev, [selectRoomName ?? '']: true }));
    //     }
    // }, [selectRoomName]);


    //各ルームのメッセージを取得する
    useEffect(() => {
        if(selectedRoom){
            const fetchMessages = async () => {
              if (!userId) {
                console.error("userId is null or undefined");
                return;
              }
              const userDocRef = doc(db, "users",userId); 
              const roomsCollectionRef = collection(userDocRef, "rooms");
              const roomDocRef = doc(roomsCollectionRef, selectedRoom ?? "defaultRoom");
              const messageCollectionRef = collection(roomDocRef, "messages");
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




    // 8秒間ユーザ発話がなければ自動的にchatgpt_auto_recommendのAPIを呼び出す
    useEffect(() => {
      const checkAutoRecommend = async () => {
        if (!userId) {
          console.error("userId is null or undefined");
          return;
        }
        const userDocRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();

        console.log("Checking auto recommend conditions:");
        //console.log("transcript:", transcript);
        console.log("autoRecommendCalled:", autoRecommendCalled);
        console.log("isBotResponding:", isBotResponding);
        console.log("recording:", recording);
       // console.log("searchEndedRef.current:", searchEndedRef.current);
        console.log("userData.groupNumber:", userData?.groupNumber)
       
//shouldCallWithTimeoutの条件をroomNameを使用して評価　//修正必要
const shouldCallWithTimeout = (
  (userData?.groupNumber >= 1 && userData?.groupNumber <= 3 && selectRoomName === 'タスク3') ||
  (userData?.groupNumber >= 4 && userData?.groupNumber <= 6 && selectRoomName === 'タスク1') ||
  (userData?.groupNumber >= 7 && userData?.groupNumber <= 9 && selectRoomName === 'タスク2')
);
  
        if (shouldCallWithTimeout) {
          const timer = setTimeout(async () => {
            if ( !autoRecommendCalled && !isBotResponding && !recording && !isLoading && calledWithTimeout) { // 録音中でないことを確認 !transcript &&
              setAutoRecommendCalled(true); // API呼び出しフラグを設定
              const apiUrl = '/api/openai/chatgpt_auto_recommend';
              const body = JSON.stringify({ text: '', history });
  
              try {
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body,
                });
  
                const response_data = await response.json();
                const botres = response_data.airesponse;
  
                if (botres) {
                  const userDocRef = doc(db, "users", userId);
                  const roomsCollectionRef = collection(userDocRef, "rooms");
                  const roomDocRef = doc(roomsCollectionRef, selectedRoom ?? "defaultRoom");
                  const messageCollectionRef = collection(roomDocRef, "messages");

                  const botMessageRef = await addDoc(messageCollectionRef, {
                    text: botres,
                    sender: "bot",
                    createdAt: serverTimestamp(),
                    endTime: null,
                  });
                 

                  //setLastBotMessageId(botMessageRef.id); // 最後のボットメッセージIDを保存
  
                  setHistory(prevHistory => [...prevHistory, { role: 'assistant', content: botres }]);
  
                  const body = JSON.stringify({ text: botres });
                  const response = await fetch('/api/openai/tts', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body,
                  });
  
                  if (!response.ok) {
                    throw new Error('レスポンスがネットワーク問題により再生できません．');
                  }
  
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const audio = new Audio(url);
                  //audioRef.current = audio; // Audioオブジェクトを保存
  
                  setIsBotResponding(true);
                  audio.play();
                  botStartTime = Timestamp.now();
                  await setDoc(botMessageRef, { createdAt: botStartTime }, { merge: true });
  
                  audio.addEventListener('ended', async () => {
                    botEndTime = Timestamp.now();
                    await setDoc(botMessageRef, { endTime: botEndTime }, { merge: true });
                    setIsBotResponding(false);
                    setAutoRecommendCalled(false);
                  });
                }
              } catch (error) {
                console.log(error);
                setAutoRecommendCalled(false);
              }
            }
          }, 6000);
          //setCalledWithTimeout(false);
  
          setAutoRecommendTimer(timer);
         
        }
      };

      if (botEndTime) {
        setAutoRecommendCalled(false); // botEndTimeが更新されるたびにリセット
        checkAutoRecommend();
      }
  
      return () => {
        if (autoRecommendTimer) {
          clearTimeout(autoRecommendTimer);
        }
      };
    }, [botEndTime, history, userId, isBotResponding, recording,isLoading,calledWithTimeout])//searchEnded, transcript,]); // isRecordingを依存関係に追加




  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectRoomName && isCountdownActive[selectRoomName] && timeLeft[selectRoomName] > 0) {
        timer = setTimeout(() => {
            setTimeLeft(prev => ({ ...prev, [selectRoomName]: prev[selectRoomName] - 1 }));
        }, 1000);
    } else if (selectRoomName && timeLeft[selectRoomName] === 0) {
      alert("10分経過しました．検索を終了します")
      setCompletedTasks(prev => ({ ...prev, [selectRoomName]: true }));
      setSearchEnd(prev => ({ ...prev, [selectRoomName]: true }));
      setIsSurveyVisible(prev => ({ ...prev, [selectRoomName]: true }));
      // const confirmResult = window.confirm("10分が経過しました。処理を続行しますか？");
      //   if(confirmResult){
      //     setRecording(false);
      //     setIsCountdownActive(prev => ({ ...prev, [selectRoomName]: false }));     

       
    }
    return () => clearTimeout(timer);
}, [timeLeft, isCountdownActive, selectRoomName]);

const handleEndSearch = async () => {
  if (window.confirm('本当に終了しますか？') && selectRoomName) {
    setCompletedTasks(prev => ({ ...prev, [selectRoomName]: true }));
    setSearchEnd(prev => ({ ...prev, [selectRoomName]: true }));
   // setShowTasks(true);
     

          // テキストデータと音声データを削除
    setTranscript('');
    setAudioFile(null);

  // autoRecommendTimerをクリアし、autoRecommendCalledをリセット
  if (autoRecommendTimer) {
    clearTimeout(autoRecommendTimer);
    setAutoRecommendTimer(null);
  }
  setAutoRecommendCalled(false);


    
   
    if (selectRoomName === '事前タスク') {
      if (!userId) {
        console.error("userId is null or undefined");
        return;
      }
      const userDocRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.data();
      
      if (userData) {
        const groupCollectionRef = collection(db, "users");
        const groupSnapshot = await getDocs(groupCollectionRef); 
        const userCount = groupSnapshot.size-1; // ユーザー数をカウント
       

        await runTransaction(db, async (transaction: Transaction) => { 
          const groupNumber = (userCount % 9) + 1; 
          transaction.set(userDocRef, { groupNumber: groupNumber }, { merge: true });
          setUserData((prevUserData:any) => ({ ...prevUserData, groupNumber: groupNumber }));

                    // ここでroomsドキュメントを更新
                    const roomsCollectionRef = collection(userDocRef, "rooms");
                    const roomDocsSnapshot = await getDocs(roomsCollectionRef);
                    roomDocsSnapshot.forEach((doc) => {
                      const roomName = doc.data().name;
                      let apiUrl = '';
          
                      // API URLを決定
                      if ([1, 2, 3].includes(groupNumber)) {
                        if (roomName === 'タスク1') apiUrl = '/api/openai/chatgpt';
                        if (roomName === 'タスク2') apiUrl = '/api/openai/chatgpt_with_recommendation';
                        if (roomName === 'タスク3') apiUrl = '/api/openai/chatgpt_with_timeout';
                      } else if ([4, 5, 6].includes(groupNumber)) {
                        if (roomName === 'タスク1') apiUrl = '/api/openai/chatgpt_with_timeout';
                        if (roomName === 'タスク2') apiUrl = '/api/openai/chatgpt';
                        if (roomName === 'タスク3') apiUrl = '/api/openai/chatgpt_with_recommendation';
                      } else if ([7, 8, 9].includes(groupNumber)) {
                        if (roomName === 'タスク1') apiUrl = '/api/openai/chatgpt_with_recommendation';
                        if (roomName === 'タスク2') apiUrl = '/api/openai/chatgpt_with_timeout';
                        if (roomName === 'タスク3') apiUrl = '/api/openai/chatgpt';
                      }
          
                      // systemフィールドにAPI URLを格納
                      if (apiUrl) {
                        transaction.set(doc.ref, { system: apiUrl }, { merge: true });
                      }
                    });

        }); 
      } 
    } 
   setIsSurveyVisible(prev => ({ ...prev, [selectRoomName]: true }));
  }
};


  const startRecording = async () => {
    if (isRecordingDisabled || !selectRoomName) return;
    if (!hasStarted[selectRoomName]) {
        reset();
        setTimeLeft(prev => ({ ...prev, [selectRoomName]: 10 * 60 })); // 10分にリセット
        setIsCountdownActive(prev => ({ ...prev, [selectRoomName]: true })); // カウントダウンを開始
        start();
        setHasStarted(prev => ({ ...prev, [selectRoomName]: true }));
    }
//追加
    if (autoRecommendTimer) {
      clearTimeout(autoRecommendTimer); // タイマーをクリア
      setAutoRecommendTimer(null); // タイマーをリセット
    }

    await recorder.current
        .start()
        .then(async () => {
            setRecording(true);
            //setIsRecording(true); // 録音中の状態を設定

            // 発話開始時間を取得
            startTime = Timestamp.now();

        })
        .catch((error: string) => {
            console.error(error);
        });
};

    //音声録音ていし
    const stopRecording = async() => {
        pause()

        await recorder.current
        .stop()
        .getMp3()
        .then(async([buffer, blob]: any) => {

        const file = new File(buffer, 'audio.mp3', {
            type: blob.type,
            lastModified: Date.now(),
          })
          // 録音停止
          setIsLoading(true)
          setAudioFile(file)
          await uploadToFirebase(blob);
          

          
          
        })
        .catch((error: string) => {
          console.log(error)
          setIsLoading(false)
        })
  
      // 録音停止
      setRecording(false)
      //setIsRecording(false); // 録音中の状態をリセット
      endTime = Timestamp.now();

      
     
    }
// Firebase Storageにアップロードする関数
const uploadToFirebase = async (audioBlob: Blob) => {
    const storageRef = ref(storage, `audios/${userId}/${new Date().getTime()}.mp3`);
    try {
        const snapshot = await uploadBytes(storageRef, audioBlob);
        console.log('Uploaded a blob or file!', snapshot);
    } catch (error) {
        console.error('Upload failed', error);
    }
};

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
      



    //送信メッセージ
    const sendMessage = async () => { //transcriptなし
        setIsLoading(true)
        
        //console.log(`trascript data ${transcript}`)
        
        try{
          if(transcript) { 
            //messeageテーブルに追加
            let apiUrl = '/api/openai/chatgpt';
            const messageData = {
              text:transcript, //inputMessageでなくても良さそう
              sender:"user",
              createdAt:startTime ,
              endAt:endTime,
              queryTime:null,
              // || serverTimestamp(),
          };
  

                    // messageをfirestoreに保存
                    if (!userId) {
                      console.error("userId is null or undefined");
                      return;
                    }
                    const userDocRef = doc(db, "users", userId); 
                    const roomsCollectionRef = collection(userDocRef, "rooms");
                    const roomDocRef = doc(roomsCollectionRef, selectedRoom ?? "defaultRoom");
                    const messageCollectionRef = collection(roomDocRef, "messages");
                    const messageDocRef = await addDoc(messageCollectionRef, messageData);
          
                    // queryTimeを更新
                    queryTime = startTime ? startTime.toMillis() - (botEndTime ? botEndTime.toMillis() : 0) : null;
                    await setDoc(messageDocRef, { queryTime: queryTime }, { merge: true });

                    const updatedHistory = [...history, { role: 'user' as 'user' | 'assistant', content: transcript }]; //追加
                    setHistory(updatedHistory);//追加
              
                    router.refresh();//追加


                    //以下場合わけ追加
                    const userSnapshot = await getDoc(userDocRef);
                    const userData = userSnapshot.data();

                    console.log("taskSequence:", userData?.taskSequence);
                    console.log("selectRoomName:", selectRoomName);
                    
                

            // groupNumberとselectRoomNameに基づいてAPI URLを変更
            if (userData && userData.groupNumber) {
              const { groupNumber } = userData;

              // groupNumber: 1, 2, 3 の場合
              if ([1, 2, 3].includes(groupNumber)) {
                  if (selectRoomName === 'タスク2') apiUrl = '/api/openai/chatgpt_with_recommendation';
                  if (selectRoomName === 'タスク3') apiUrl = '/api/openai/chatgpt_with_timeout';
 
              }
              // groupNumber: 4, 5, 6 の場合
              else if ([4, 5, 6].includes(groupNumber)) {
                  if (selectRoomName === 'タスク1') apiUrl = '/api/openai/chatgpt_with_timeout';
                  if (selectRoomName === 'タスク3') apiUrl = '/api/openai/chatgpt_with_recommendation';

              }
              // groupNumber: 7, 8, 9 の場合
              else if ([7, 8, 9].includes(groupNumber)) {
                  if (selectRoomName === 'タスク1') apiUrl = '/api/openai/chatgpt_with_recommendation';
                  if (selectRoomName === 'タスク2') apiUrl = '/api/openai/chatgpt_with_timeout';

              }

              
          }
          if (apiUrl === '/api/openai/chatgpt_with_timeout') {
           setCalledWithTimeout(true);
            }
            console.log("apiUrl:",apiUrl)
           console.log("calledWithTimeout",calledWithTimeout)
              

          //送信データ
          const body = JSON.stringify({ text : transcript,history:updatedHistory})
          //console.log(body)

          //chatGPT API
          const response = await fetch(apiUrl, {
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
            const userDocRef = doc(db, "users",userId); 
            const roomsCollectionRef = collection(userDocRef, "rooms");
            const roomDocRef = doc(roomsCollectionRef, selectedRoom ?? "defaultRoom");
            const messageCollectionRef = collection(roomDocRef, "messages");
            
            const botMessageRef = await addDoc(messageCollectionRef, {
              text: botres, // または、期待される応答変数をここに設定
              sender: "bot",
              createdAt: serverTimestamp(),
              endTime:null,
            });
          
          setHistory(prevHistory => [...prevHistory, { role: 'assistant', content: botres }]);

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
          //audioRef.current = audio; // Audioオブジェクトを保存
          
          setIsBotResponding(true);
          audio.play();
          botStartTime = Timestamp.now()
          await setDoc(botMessageRef,{createdAt:botStartTime},{merge:true});


          audio.addEventListener('ended',async () => {
            botEndTime = Timestamp.now();
            await setDoc(botMessageRef, {endTime:botEndTime},{merge:true})
            setIsBotResponding(false);
          })
        }//追加



          }


        }catch(error){
          console.log(error)

        }

        setPrompt('')
        setTranscript('')
        setIsLoading(true)
            
    }

useEffect(() => {
  const fetchUserData = async () => {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      setUserData(userSnapshot.data());
    }
  };

  fetchUserData();
}, [userId]);

const renderTaskDescription = () => {
  // if (currentTask === '事前タスク') {
  //     return (
  //         <div className='mb-4'>
  //             <h2 className='text-xl font-bold'>トピック：</h2>
  //             <p>事前タスクのトピックについて</p>
  //             <h2 className='text-xl font-bold'>シナリオ：</h2>
  //             <p>事前タスクのシナリオについての説明文</p>
  //         </div>
  //     );
  // }

  const taskOrder:{ [key: number]: string[] } = {
      1: ['事前タスク', 'タスク1', 'タスク2', 'タスク3'],
      4: ['事前タスク', 'タスク1', 'タスク2', 'タスク3'],
      7: ['事前タスク', 'タスク1', 'タスク2', 'タスク3'],
      2: ['事前タスク', 'タスク3', 'タスク1', 'タスク2'],
      5: ['事前タスク', 'タスク3', 'タスク1', 'タスク2'],
      8: ['事前タスク', 'タスク3', 'タスク1', 'タスク2'],
      3: ['事前タスク', 'タスク2', 'タスク3', 'タスク1'],
      6: ['事前タスク', 'タスク2', 'タスク3', 'タスク1'],
      9: ['事前タスク', 'タスク2', 'タスク3', 'タスク1'],
  };
  

  const userGroupNumber = userData?.groupNumber ?? 1; // userDataからgroupNumberを取得
  const taskSequence = taskOrder[userGroupNumber];

  switch (selectRoomName) {
      case taskSequence[0]:
          return (
              <div className='mb-4'>
                  <h2 className='text-xl font-bold'>トピック：</h2>
                  <p>事前タスクのトピックについて</p>
                  <h2 className='text-xl font-bold'>シナリオ：</h2>
                  <p>事前タスクのシナリオについての説明文</p>
                  
                  
              </div>
          );
      case taskSequence[1]:
          return (
              <div className='mb-4'>
                  <h2 className='text-xl font-bold'>トピック：</h2>
                  <p>ダークチョコレートの健康への効果について</p>
                  <h2 className='text-xl font-bold'>シナリオ：</h2>
                  <p>ダークチョコレートの健康効果について，テレビで特集が組まれた結果SNSでバズっています．興味をもったあなたは，最新のアレクサを使って調べることにしました．調べた後は，最近健康食にはまりだした友人にダークチョコレートの健康への効果を伝えようと思っています．調べたことをまとめてください．</p>
              </div>
          );
      case taskSequence[2]:
          return (
              <div className='mb-4'>
                  <h2 className='text-xl font-bold'>トピック：</h2>
                  <p>風力発電について</p>
                  <h2 className='text-xl font-bold'>シナリオ：</h2>
                  <p>学校の授業でSDGsのことについて学んだあなた．持続可能な開発の中で自然エネルギーに関して，調べてくるよう先生から宿題が課されました．自然エネルギーに関して調べていく中で風力発電に興味を持ちました．風力発電に関して調べて，調べたことをまとめてください．</p>
              </div>
          );
      case taskSequence[3]:
          return (
              <div className='mb-4'>
                  <h2 className='text-xl font-bold'>トピック：</h2>
                  <p>スティーブン・スピルバーグ監督について</p>
                  <h2 className='text-xl font-bold'>シナリオ：</h2>
                  <p>最近映画にはまり，毎週のように金曜ロードショーで映画を見ています．さらにネットフリックスも契約し，毎日のように映画をみています．良い映画がないかなと調べていると，スティーブン・スピルバーグ監督の映画が評価がよいことがわかりました．気になったあなたは，スティーブン・スピルバーグ監督について調べようと思いました．調べたことをまとめてください．</p>
              </div>
          );
      default:
          return null;
  }
};


  return (
    <>
    {allTasksCompleted ? (<div>タスクは全て完了しました。</div>) :(
    <div className='bg-main-blue h-full flex flex-col p-4'>
 {isSurveyVisible[selectRoomName ?? ''] ? ( // 修正: nullを空文字列に変換
        <Survey taskName={selectRoomName ?? ''} /> // nullの場合は空文字列を渡すonSubmit={handleSurveySubmit}
      )  : (
      <>
        <h1 className='text-2xl text-slate-500 font-semibold mb-4'>{selectRoomName}</h1>
        {selectRoomName === currentTask && renderTaskDescription()}
        {/* {renderTaskDescription()} */}

          {selectRoomName && !completedTasks[selectRoomName] && hasStarted[selectRoomName] ? (
            <div className='m-auto text-red-500 text-xl'>
                残り時間:<span>{`${Math.floor((timeLeft[selectRoomName] ?? 0) / 60)}:${('0' + ((timeLeft[selectRoomName] ?? 0) % 60)).slice(-2)}`}</span>
            </div>)
            : ("")
        }


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
            {selectRoomName && !completedTasks[selectRoomName] && (
              <div className="text-white font-bold">
                <span>{('0' + minutes).slice(-2)}</span>:<span>{('0' + seconds).slice(-2)}</span>
              </div>
            )}
          </div>
        ) : recording ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <StopIcon className="h-7 w-7 cursor-pointer text-white" onClick={stopRecording} />
            </div>
            {selectRoomName && !completedTasks[selectRoomName] && (
              <div className="text-white font-bold">
                <span>{('0' + minutes).slice(-2)}</span>:<span>{('0' + seconds).slice(-2)}</span>
              </div>
            )}
          </div>
        ) : isBotResponding ? (
          <div className="text-gray-500 font-bold w-[240px] justify-center">
            システム回答中・・・
          </div>
        ): autoRecommendCalled ? (
          <div className="text-gray-500 font-bold w-[240px] justify-center">
          システム推薦準備中・・・
        </div>
        )
        :
          (<div className="flex flex-col items-center justify-center">
            {selectRoomName && completedTasks[selectRoomName] ? (
              <div className="text-gray-500 font-bold w-[240px] text-center">
                タスクが完了しました．<br />アンケートに答えてください
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <MicrophoneIcon
                    className="h-7 w-7 text-gray-700 cursor-pointer"
                    onClick={startRecording}
                  />
                </div>
                {/* <div className="text-white font-bold">
                  <span>{('0' + minutes).slice(-2)}</span>:<span>{('0' + seconds).slice(-2)}</span>
                </div> */}
              </>
            )}
          </div>
        )}
        </div>
        </div>
        <div className='flex justify-end mt-4'>
        {selectRoomName && !completedTasks[selectRoomName] && (
                    <button className='bg-black text-white w-36 h-10 rounded hover:bg-slate-800' onClick={handleEndSearch}>
                        検索終了
                    </button>
                )}
        {/* <button className='bg-black text-white w-36 h-10 rounded hover:bg-slate-800' onClick={handleEndSearch} disabled={searchEnd}>検索終了</button> */}
        </div>
        </>
    )}
    </div>)}
    </>
   
    
  )
}

export default Chat