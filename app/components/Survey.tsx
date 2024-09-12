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

interface WorkloadFactors {
  [key: `workloadFactor${number}`]: FormDataEntryValue | null;
}



const Survey:React.FC<SurveyProps> = ({ taskName, }) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const {selectRoomName,userId,currentTask, setCurrentTask,showFollowUpSurvey, setShowFollowUpSurvey} = useAppContext();
  const [isCompletedFinal, setIsCompletedFinal] = useState<boolean>(false);
  const [completeCheck,setCompleteCheck] = useState<boolean>(false);
  //const [sliderValue, setSliderValue] = useState<number>(10);
  const [intellectualCuriosityValue, setIntellectualCuriosityValue] = useState<number>(10);
const [physicalDemandValue, setPhysicalDemandValue] = useState<number>(10);
const [timePressureValue, setTimePressureValue] = useState<number>(10);
const [performanceValue, setPerformanceValue] = useState<number>(10);
const [effortValue, setEffortValue] = useState<number>(10);
const [frustrationValue, setFrustrationValue] = useState<number>(10);

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
    "検索エージェントの応答の長さは適切だと感じた",
    "様々な観点から情報を収集できたと感じた",
    "この検索エージェントは様々な情報を獲得するうえで役に立ったと感じた",
    "意見をまとめるうえで必要な情報が十分に集められたと感じた"
  ];


  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setter(Number(event.target.value));
  }


    if (isCompleted) {
      // アンケートが送信済みの場合の表示
      return <div>回答ありがとうございました。サイドバーから次のタスクに進んでください</div>;
    }

    if (isCompletedFinal && !showFollowUpSurvey) {
      return <div>お疲れ様でした。全てのタスクが終了しました。タスク完了コードは, 「TY2024SCS」です．ログアウトしてください。</div>;
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
      // アンケートの新しい質問を追加
  const newQuestions = {
    "邪魔な-協力的な": formData.get("question17"),
    "複雑-簡単": formData.get("question18"),
    "非効率的-効率的": formData.get("question19"),
    "混乱する-明確である": formData.get("question20"),
    "つまらない-エキサイティング": formData.get("question21"),
    "面白くない-面白い": formData.get("question22"),
    "型にはまった-独創的な": formData.get("question23"),
    "いつもの-先端": formData.get("question24"),
  };
    // スライダーの値を取得
    const sliderValues = {
      intellectualCuriosityValue: formData.get("intellectualCuriosity"),
      physicalDemandValue: formData.get("physicalDemand"),
      timePressureValue: formData.get("timePressure"),
      performanceValue: formData.get("performance"),
      effortValue: formData.get("effort"),
      frustrationValue: formData.get("frustration"),
    };

      // ワークロードの要因を選択するラジオボタンの値を取得
      const workloadFactors: WorkloadFactors = {};
      for (let i = 0; i < 15; i++) {
        workloadFactors[`workloadFactor${i}`] = formData.get(`workloadFactor${i}`);
      }
      
    const ransersId = formData.get("ransersId"); // ユーザーIDを取得
    const summary = formData.get("summary"); // 概要を取得
    const answers:Answers = {
    createdAt: new Date(),
    Q1: ransersId,
    Q2: summary,
    isCompleted:true,
    ...newQuestions,
    ...sliderValues,
    ...workloadFactors
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
    rancers: formData.get("rancers"),
    occupation: formData.get("occupation"),
    interestInTech: formData.get("interestInTech"),
    communicationSkill: formData.get("communicationSkill"),
    voiceAgentUsed: formData.getAll("voiceAgentUsed"),
    voiceAgentPurpose: formData.getAll("voiceAgentPurpose"),
    voiceAgentFrequency: formData.get("voiceAgentFrequency"),
    voiceAgentTrust: formData.get("voiceAgentTrust"),
    gpt: formData.get("gpt"),
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
          {/* <div className="flex flex-col">
            <label className="font-medium">ご自身のIDを選択してください:</label>
            <input type="text" name="ransersId" required className="mt-1 p-2 border border-gray-300 rounded-md" />
          </div> */}
          <div className="flex flex-col">
            <label className="font-medium">検索エージェントで調べたことをまとめてください:</label>
            <textarea name="summary" required className="mt-1 p-2 border border-gray-300 rounded-md h-32"></textarea>
          </div>
          {/* 各質問 */}
        {questions.map((question, index) => (
  <div key={index} className="flex flex-col ">
    <div className="font-medium">Q{index + 3}. {question}</div>
    <div className="flex my-3">
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
<div>
<p className='font-bold'>次の反対語のうち，どちらが対話エージェントを適切に表しているかを自発的に判断してください．「正しい」答えや「間違った」答えはありません。あなたの個人的意見が重要です．</p>
    {[
        "邪魔な-協力的な",
        "複雑-簡単",
        "非効率的-効率的",
        "混乱する-明確である",
        "つまらない-エキサイティング",
        "面白くない-面白い",
        "型にはまった-独創的な",
        "いつもの-先端",
      ].map((question, index) => (
        <div key={index} className="flex flex-col">
          <div className="font-medium">Q{index + 17}. {question}</div>
          <div className="flex mt-1">
            {Array.from({ length: 7 }, (_, i) => i + 1).map(optionIndex => (
              <label key={optionIndex} className="inline-flex items-center mr-2">
                <input
                  type="radio"
                  name={`question${questions.length + index + 3}`}
                  value={optionIndex}
                  required
                  className="mr-1"
                />
                {optionIndex}
              </label>
            ))}
          </div>
        </div>
      ))}
      </div>

      <div className="flex flex-col">
        <p className='font-bold'>タスクの経験に最も近い各スケール上のポイントをクリックしてください</p>
      <div className='mb-6 mt-2'>
    <label htmlFor="intellectualCuriosity">知的・知覚的要求</label>
    <p>どの程度の知的・知覚的活動(考える，決める，計算する，記憶する，見るなど)を必要としましたか．課題はやさしかったですか難しかったですか，単純でしたか複雑でしたか，正確さが求められましたか大ざっぱでよかったですか</p>
    <input
      type="range"
      id="intellectualCuriosity"
      name="intellectualCuriosity"
      min="1"
      max="20"
      value={intellectualCuriosityValue}
      onChange={handleSliderChange(setIntellectualCuriosityValue)}
      className="w-full"
    />
      <div className="flex justify-between text-s">
    <span>小さい</span>
    <span>大きい</span>
  </div>
     <div className='text-xs'>現在の値: {intellectualCuriosityValue}</div>
     </div>
     
     <div>
     <label htmlFor="physicalDemand">身体的要求</label>
    <p>どの程度の身体的活動(押す，引く，回す，制御する，動き回るなど)を必要としましたか．作業はラクでしたかキツかったですか，ゆっくりできましたかキビキビやらなければなりませんでしたか，休み休みできましたか働きづめでしたか</p>
    <input
      type="range"
      id="physicalDemand"
      name="physicalDemand"
      min="1"
      max="20"
      value={physicalDemandValue}
      onChange={handleSliderChange(setPhysicalDemandValue)}
      className="w-full"
    />
    <div className="flex justify-between text-s">
    <span>小さい</span>
    <span>大きい</span>
  </div>
     <div className='text-xs'>現在の値: {physicalDemandValue}</div>
     </div>
     

     <div className='mb-6 mt-2'>
     <label htmlFor="timePressure">タイムプレッシャー</label>
     <p>仕事のペースや課題が発生する頻度のために感じる時間的切迫感はどの程度でしたか．ペースはゆっくりとして余裕があるものでしたか，それとも速くて余裕のないものでしたか</p>
    <input
      type="range"
      id="timePressure"
      name="timePressure"
      min="1"
      max="20"
      value={timePressureValue}
      onChange={handleSliderChange(setTimePressureValue)}
      className="w-full"
    />
  <div className="flex justify-between text-s">
    <span>弱い</span>
    <span>強い</span>
  </div>
     <div className='text-xs'>現在の値: {timePressureValue}</div>
     </div>

     <div className='mb-6 mt-2'>
     <label htmlFor="performance">作業成績</label>
     <p>作業指示者(またはあなた自身)によって設定された課題の目標をどの程度達成できたと思いますか．目標の達成に関して自分の作業成績にどの程度満足していますか</p>
    <input
      type="range"
      id="performance"
      name="performance"
      min="1"
      max="20"
      value={performanceValue}
      onChange={handleSliderChange(setPerformanceValue)}
      className="w-full"
    />
    <div className="flex justify-between text-s">
    <span>良い</span>
    <span>悪い</span>
  </div>
     <div className='text-xs'>現在の値: {performanceValue}</div>
     </div>

     <div className='mb-6 mt-2'>
     <label htmlFor="effort">努力</label>
     <p>作業成績のレベルを達成・維持するために，精神的・身体的にどの程度いっしょうけんめいに作業しなければなりませんでしたか</p>
    <input
      type="range"
      id="effort"
      name="effort"
      min="1"
      max="20"
      value={effortValue}
      onChange={handleSliderChange(setEffortValue)}
      className="w-full"
    />
  <div className="flex justify-between text-s">
    <span>少ない</span>
    <span>多い</span>
  </div>
     <div className='text-xs'>現在の値: {effortValue}</div>
     </div>

     <div className='mb-6 mt-2'>
     <label htmlFor="frustration">フラストレーション</label>
     <p>作業中に，不安感，落胆，いらいら，ストレス，悩みをどの程度感じましたか．あるいは逆に，安心感，満足感，充足感，楽しさ，リラックスをどの程度感じましたか</p>
    <input
      type="range"
      id="frustration"
      name="frustration"
      min="1"
      max="20"
      value={frustrationValue}
      onChange={handleSliderChange(setFrustrationValue)}
      className="w-full"
    />
   <div className="flex justify-between text-s">
    <span>低い</span>
    <span>高い</span>
  </div>
     <div className='text-xs'>現在の値: {frustrationValue}</div>
     </div>
  </div>


  <div className="flex flex-col mb-4">
  <p className="font-bold">タスクのワークロード(作業負荷)へのより重要な要因を表す要素をクリックしてください:</p>
  {[
    ["知的・知覚的要求", "フラストレーション"],
    ["努力", "作業成績"],
    ["作業成績", "フラストレーション"],
    ["タイムプレッシャー", "作業成績"],
    ["努力", "身体的要求"],
    ["知的・知覚的要求", "身体的要求"],
    ["作業成績", "身体的要求"],
    ["努力", "タイムプレッシャー"],
    ["知的・知覚的要求", "努力"],
    ["努力", "フラストレーション"],
    ["タイムプレッシャー", "身体的要求"],
    ["知的・知覚的要求", "タイムプレッシャー"],
    ["フラストレーション", "身体的要求"],
    ["知的・知覚的要求", "作業成績"],
    ["タイムプレッシャー", "フラストレーション"],
    // 他の要素ペアをここに追加
  ].map((pair, index) => (
    <div key={index} className="mt-2">
      <label className="items-center mr-4">
        <input
          type="radio"
          name={`workloadFactor${index}`}
          value={pair[0]}
          required
          className="mr-2"
        />
        {pair[0]}
      </label>
      <span className="mx-2">or</span>
      <label className="items-center">
        <input
          type="radio"
          name={`workloadFactor${index}`}
          value={pair[1]}
          required
          className="mr-2"
        />
        {pair[1]}
      </label>
    </div>
  ))}
</div>

  
          <button type="submit" className="mt-4 px-4 py-2 bg-custom-blue text-white font-medium rounded-md hover:bg-blue-600">送信する</button>
        </form>  
</div>
    </>
  );
  
};

export default Survey;