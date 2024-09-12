import React from 'react'

interface FinalSurveyFormProps {
    handleFinalSurveySubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }

const FinalSurvey: React.FC<FinalSurveyFormProps> = ({ handleFinalSurveySubmit }) => {
    return (
        <>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">追加のアンケート</h1>
      <form  onSubmit={handleFinalSurveySubmit} className="space-y-4"> 
      <div className="flex flex-col">
          <label  className="font-medium">Q1. あなたのランサーズIDをご記入ください:</label>
          <input type="text" id="rancers" name="rancers" required className="mt-1 p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="age" className="font-medium">Q2. あなたの年齢をご記入ください:</label>
          <input type="number" id="age" name="age" required className="mt-1 p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="flex flex-col">
          <label className="font-medium">Q3. あなたの職業について教えてください:</label>
          <select name="occupation" required className="mt-1 p-2 border border-gray-300 rounded-md">
            <option value="1">学生</option>
            <option value="2">社会人</option>
            <option value="3">その他</option>
          </select>
        </div>
        {/* Q3. 新しいテクノロジーへの興味関心 */}
<div className="flex flex-col">
  <label className="font-medium">Q4. あなたの新しいテクノロジーへの興味関心について5段階で教えてください:</label>
  <div className="mt-2">
    {["全く興味がない", "あまり興味がない", "どちらでもない", "まあ興味がある", "とても興味がある"].map((option, index) => (
      <div key={index}>
        <input type="radio" id={`interestInTech-${index}`} name="interestInTech" value={index + 1} required />
        <label htmlFor={`interestInTech-${index}`} className="ml-2">{option}</label>
      </div>
    ))}
  </div>
</div>

{/* Q4. コミュニケーションの得意・不得意 */}
<div className="flex flex-col">
  <label className="font-medium">Q5. あなたの人とのコミュニケーションの得意・不得意について5段階で教えてください:</label>
  <div className="mt-2">
    {["全く得意ではない", "あまり得意ではない", "どちらでもない", "まあ得意である", "とても得意である"].map((option, index) => (
      <div key={index}>
        <input type="radio" id={`communicationSkill-${index}`} name="communicationSkill" value={index + 1} required />
        <label htmlFor={`communicationSkill-${index}`} className="ml-2">{option}</label>
      </div>
    ))}
  </div>
</div>

{/* Q5. 利用したことのある音声対話型エージェント */}
<div className="flex flex-col">
  <label className="font-medium">Q6. 利用したことのある音声対話型エージェントについて教えてください（複数回答可）:</label>
  <div className="mt-2">
    {["Alexa", "GoogleHome", "Siri", "その他"].map((agent, index) => (
      <div key={index}>
        <input type="checkbox" id={`voiceAgentUsed-${index}`} name="voiceAgentUsed" value={agent} />
        <label htmlFor={`voiceAgentUsed-${index}`} className="ml-2">{agent}</label>
      </div>
    ))}
  </div>
</div>

{/* Q6. 音声対話型エージェントの利用目的 */}
{/* 注意: この質問はQ5の後に来ていますが、質問番号がQ6となっています。質問の順番に注意してください。 */}
<div className="flex flex-col">
  <label className="font-medium">Q7. 音声対話型エージェントの利用目的について教えてください（複数回答可）:</label>
  <div className="mt-2">
    {["天気予報の確認", "音楽を聴く", "音声入力", "テキストやメールの送信", "交通情報", "家電のコントロール", "デスクトップと同じ情報検索", "使ったことがないのでわからない", "その他"].map((purpose, index) => (
      <div key={index}>
        <input type="checkbox" id={`voiceAgentPurpose-${index}`} name="voiceAgentPurpose" value={purpose} />
        <label htmlFor={`voiceAgentPurpose-${index}`} className="ml-2">{purpose}</label>
      </div>
    ))}
  </div>
</div>

{/* Q7. 音声対話型検索エージェントの利用頻度 */}
<div className="flex flex-col">
  <label className="font-medium">Q8. Q5で答えた音声対話型検索エージェントの利用頻度について教えてください:</label>
  <div className="mt-2">
    {["毎日", "週4~5日", "週2~3日", "週1回", "その他", "使ったことがない"].map((frequency, index) => (
      <div key={index}>
        <input type="radio" id={`voiceAgentFrequency-${index}`} name="voiceAgentFrequency" value={frequency} required />
        <label htmlFor={`voiceAgentFrequency-${index}`} className="ml-2">{frequency}</label>
      </div>
    ))}
  </div>
</div>

{/* Q8. 音声対話型エージェントへの信頼度 */}
<div className="flex flex-col">
  <label className="font-medium">Q9. 音声対話型エージェントへの信頼度について5段階で教えてください:</label>
  <div className="mt-2">
    {["全く信頼していない", "あまり信頼していない", "どちらでもない", "まあ信頼している", "とても信頼している"].map((option, index) => (
      <div key={index}>
        <input type="radio" id={`voiceAgentTrust-${index}`} name="voiceAgentTrust" value={index + 1} required />
        <label htmlFor={`voiceAgentTrust-${index}`} className="ml-2">{option}</label>
      </div>
    ))}
  </div>
</div>

<div className="flex flex-col">
          <label className="font-medium">Q10. あなたはChatGPTを利用したことがありますか？:</label>
          <select name="gpt" required className="mt-1 p-2 border border-gray-300 rounded-md">
            <option value="1">はい</option>
            <option value="2">いいえ</option>
           
          </select>
</div>


{/* Q9. 情報検索行動の利用割合 */}
<div className="flex flex-col">
  <label className="font-medium">Q11. デスクトップ（PC,スマホ含む）での情報検索行動と音声での情報検索行動のおよその利用割合を教えてください:</label>
  <input type="text" name="searchBehaviorRatio" placeholder="例：80:20" required className="mt-2 p-2 border border-gray-300 rounded-md" />
</div>

{/* Q10. 情報検索の使い分け理由 */}
<div className="flex flex-col">
  <label className="font-medium">Q12. デスクトップでの情報検索と音声での情報検索の使い分け理由を教えてください:</label>
  <textarea name="searchMethodReason" required className="mt-2 p-2 border border-gray-300 rounded-md h-32"></textarea>
</div>

{/* Q11. 音声検索を利用したきっかけ */}
<div className="flex flex-col">
  <label className="font-medium">Q13. 音声検索を利用したきっかけを教えてください:</label>
  <textarea name="voiceSearchTrigger" required className="mt-2 p-2 border border-gray-300 rounded-md h-32"></textarea>
</div>

{/* Q12. 音声対話型エージェントへの不満と期待 */}
<div className="flex flex-col">
  <label className="font-medium">Q14. 音声対話型エージェントへの現状の不満と期待していることについて教えてください:</label>
  <textarea name="voiceAgentFeedback" required className="mt-2 p-2 border border-gray-300 rounded-md h-32"></textarea>
</div>
        
        <button type="submit" className="mt-4 px-4 py-2 bg-custom-blue text-white font-medium rounded-md hover:bg-blue-600">送信する</button>
      </form>
    </div>
        </>
      );
}

export default FinalSurvey