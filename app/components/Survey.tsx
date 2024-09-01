'use client'

import React, { useEffect, useState } from 'react';
import { doc, collection, getDocs, query, where, setDoc,  DocumentReference,DocumentData } from "firebase/firestore"; // setDocをインポート
import { useAppContext } from '@/context/AppContext';
import { db } from '../firebase';
import FinalSurvey from './FinalSurvey';


interface SurveyProps {
  taskName:string;
  
}

interface Answers {
  createdAt: Date;
  Q1: FormDataEntryValue | null;
  Q2: FormDataEntryValue | null;
  [key: `Q${number}`]: FormDataEntryValue | null; // 動的なキーの型を定義
  isCompleted: boolean; 
}



const Survey:React.FC<SurveyProps> = ({ taskName, }) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const {selectRoomName,userId,currentTask, setCurrentTask,showFollowUpSurvey, setShowFollowUpSurvey} = useAppContext();
  const [isCompletedFinal, setIsCompletedFinal] = useState<boolean>(false);
  const [completeCheck,setCompleteCheck] = useState<boolean>(false);

  const questions = [
    "この検索エージェントを頻繁に使うと思う",
    "この検索エージェントが不必要に複雑に感じた",
    "この検索エージェントが使うことが簡単だと思った",
    "この検索エージェントを使うために、技術に精通した人のサポートが必要だ",
    "この検索エージェントは様々な機能が統合されていることがわかった",
    "この検索エージェントは応答に一貫性がないと思った",
    "たいていの人はこの検索エージェントの使い方をすぐに学ぶことができると想像できる",
    "この検索エージェントの使い勝手が悪いと感じた",
    "この検索エージェントを安心して使えると思った",
    "この検索エージェントを使い始める前に、多くのことを学ぶ必要があると感じた",
    "この検索エージェントとの対話は自然であったと感じた",
    "様々な観点から情報を収集できたと感じた",
    "この検索エージェントは様々な情報を獲得するうえで役に立ったと感じた",
    "様々な情報を獲得するうえでシステムの観点のおすすめは有用だと感じた",
    "意見をまとめるうえで必要な情報が十分に集められたと感じた"
  ];

  // useEffect(() => {
  //   const checkCompletion = async () => {
  //     // userIdとtaskNameを使用して、適切な回答をFirebaseから取得
  //     const userDocRef = doc(db, "users", userId!);
  //     const roomsCollectionRef = collection(userDocRef, "rooms");
  //     const roomDocRef = doc(roomsCollectionRef, taskName); // taskNameに基づくドキュメント参照
  //     const answersCollectionRef = collection(roomDocRef, "answers");
  //     const querySnapshot = await getDocs(answersCollectionRef);

  //     querySnapshot.forEach((doc) => {
  //       if (doc.exists() && doc.data().isCompleted) {
  //         setIsCompleted(true);
  //       }
  //     });
  //   };

  //   checkCompletion();
  // }, [taskName]);



  // useEffect(() => {
  //   console.log(`現在のタスクは ${currentTask} です`);
  // }, [currentTask]); // currentTaskが変更されたときに実行


    if (isCompleted) {
      // アンケートが送信済みの場合の表示
      return <div>回答ありがとうございました。サイドバーから次のタスクに進んでください</div>;
    }

    if (isCompletedFinal && !showFollowUpSurvey) {
      return <div>お疲れ様でした。全てのタスクが終了しました。ログアウトしてください。</div>;
    }


    function getNextTask(currentTaskName: string): string {
      const taskOrder = ['タスク1', 'タスク2'];
      const currentIndex = taskOrder.indexOf(currentTaskName);
      const nextIndex = currentIndex + 1;
      return taskOrder[nextIndex] || 'タスク完了'; // 次のタスク、またはすべてのタスクが完了した場合
      
    }


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // フォームのデフォルトの送信を防ぐ
    const confirmed = window.confirm("本当に送信しますか？");
    if (!confirmed) return;

    //localstorageに最終アンケートを保存する
    const updateTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');
    updateTasks[`アンケート${taskName}`] = true;
    localStorage.setItem('completedTasks', JSON.stringify(updateTasks));


    // フォームからのデータを取得
    const formData = new FormData(e.target as HTMLFormElement);
    const ransersId = formData.get("ransersId"); // ユーザーIDを取得
    const summary = formData.get("summary"); // 概要を取得
    const answers:Answers = {
    createdAt: new Date(),
    Q1: ransersId,
    Q2: summary,
    isCompleted:true,
  };
  for (let i = 0; i < questions.length; i++) {
    answers[`Q${i + 3}`] = formData.get(`question${i + 3}`);
  }

  //firebase
  try {
    if (!userId) {
      console.error("userId is null or undefined");
      return;
    }
    const userDocRef = doc(db, "users",userId); 
    const roomsCollectionRef = collection(userDocRef, "rooms");
    const querySnapshot = await getDocs(query(roomsCollectionRef, where("name", "==", taskName)));
    
    
    let roomDocRef: DocumentReference<DocumentData> | undefined;;
    querySnapshot.forEach((doc) => {
      // taskNameに一致する最初のドキュメントを使用
      if (!roomDocRef) roomDocRef = doc.ref;
    });

    if (!roomDocRef) {
      console.error("指定されたtaskNameを持つroomが見つかりません。");
      alert("エラーが発生しました。");
      return;
    }

  // 指定されたroomの下にanswersコレクションを作成し、回答を保存
  const answersCollectionRef = collection(roomDocRef, "answers");
  const answerDocRef = doc(answersCollectionRef); // 新しいドキュメントIDを自動生成
  console.log("Saving answers:", answers);
  await setDoc(answerDocRef, answers, { merge: true }); // 回答データを保存
  alert("回答が送信されました。");
 
  // 次のタスクに進むロジック
  const nextTask = getNextTask(taskName);
  setCurrentTask(nextTask); // 新しいタスク名を設定
  //setIsCompleted(true)


  if (taskName === "タスク2") {
    setShowFollowUpSurvey(true); // タスク2の場合、追加のアンケートを表示
    
  } else {
    // タスク3以外の場合の処理
    setIsCompleted(true);
  }



} catch (error) {
  console.error("回答の保存に失敗しました: ", error);
  alert("回答の送信に失敗しました。");
}

}

const handleFinalSurveySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); // フォームのデフォルトの送信を防ぐ
  const confirmed = window.confirm("本当に送信しますか？");
  if (!confirmed) return;

  const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');
  completedTasks['最終アンケート'] = true;
  localStorage.setItem('completedTasks', JSON.stringify(completedTasks));

  // フォームからのデータを取得
  const formData = new FormData(e.target as HTMLFormElement);
  const finalAnswers = {
    createdAt: new Date(),
    // フォームのデータを取得してオブジェクトに格納
    age: formData.get("age"),
    occupation: formData.get("occupation"),
    interestInTech: formData.get("interestInTech"),
    communicationSkill: formData.get("communicationSkill"),
    voiceAgentUsed: formData.getAll("voiceAgentUsed"),
    voiceAgentPurpose: formData.getAll("voiceAgentPurpose"),
    voiceAgentFrequency: formData.get("voiceAgentFrequency"),
    voiceAgentTrust: formData.get("voiceAgentTrust"),
    searchBehaviorRatio: formData.get("searchBehaviorRatio"),
    searchMethodReason: formData.get("searchMethodReason"),
    voiceSearchTrigger: formData.get("voiceSearchTrigger"),
    voiceAgentFeedback: formData.get("voiceAgentFeedback"),
  };

  try {
    if (!userId) {
      console.error("userId is null or undefined");
      return;
    }
    const userDocRef = doc(db, "users", userId);
    //const roomsCollectionRef = collection(userDocRef, "rooms");
    //const roomDocRef = doc(roomsCollectionRef, "属性アンケート"); // タスク3のドキュメント参照
    const finalAnswersCollectionRef = collection(userDocRef, "final_answers"); // final_answersコレクションへの参照
    const finalAnswerDocRef = doc(finalAnswersCollectionRef); // 新しいドキュメントIDを自動生成
    console.log("Saving final answers:", finalAnswers);
    await setDoc(finalAnswerDocRef, finalAnswers, { merge: true }); // 最終アンケートの回答データを保存
    alert("最終アンケートの回答が送信されました。");

    //setIsCompleted(true); // この行を追加
    setShowFollowUpSurvey(false); // 追加のアンケート表示をオフにする
    setIsCompletedFinal(true)

  } catch (error) {
    console.error("最終アンケートの回答の保存に失敗しました: ", error);
    alert("最終アンケートの回答の送信に失敗しました。");
  }
};


//if (taskName === "タスク2" && showFollowUpSurvey) 
  // タスク2で、かつ追加のアンケートを表示する場合
  if (showFollowUpSurvey) {
    return <FinalSurvey handleFinalSurveySubmit={handleFinalSurveySubmit} />
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">{taskName}に関するアンケート</h1>
    
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="font-medium">ご自身のIDを選択してください:</label>
            <input type="text" name="ransersId" required className="mt-1 p-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex flex-col">
            <label className="font-medium">検索エージェントで調べたことをまとめてください:</label>
            <textarea name="summary" required className="mt-1 p-2 border border-gray-300 rounded-md h-32"></textarea>
          </div>
          {/* 各質問 */}
        {questions.map((question, index) => (
  <div key={index} className="flex flex-col ">
    <div className="font-medium">Q{index + 3}. {question}</div>
    <div className="flex mt-1">
      {[
        "全く当てはまらない",
        "あまり当てはまらない",
        "どちらでもない",
        "よく当てはまる",
        "とてもよく当てはまる"
      ].map((label, optionIndex) => (
        <label key={optionIndex} className="inline-flex items-center mr-2">
          <input
            type="radio"
            name={`question${index + 3}`}
            value={optionIndex + 1}
            required
            className="mr-1"
          />
          {label} 
        </label>
      ))}
    </div>
  </div>
))}
          <button type="submit" className="mt-4 px-4 py-2 bg-custom-blue text-white font-medium rounded-md hover:bg-blue-600">送信する</button>
        </form>  
</div>
    </>
  );
  
};

export default Survey;