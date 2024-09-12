'use client'

import React from 'react'
import { SubmitHandler, useForm } from 'react-hook-form';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/app/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from '@/app/firebase';
import { useAppContext } from '@/context/AppContext';



type  Inputs = {
    email:string;
    password:string;

}

const Login = () => {

    const router = useRouter();
    const {register,handleSubmit,formState:{errors},} = useForm<Inputs>();
    const { setCompletedTasks } = useAppContext(); //
    const onSubmit:SubmitHandler<Inputs> = async(data) => {
        await signInWithEmailAndPassword(auth, data.email, data.password)
        .then((userCredential) => {
            const storedCompletedTasks = localStorage.getItem('completedTasks');
            if (storedCompletedTasks !== null) {
                const completedTasks = JSON.parse(storedCompletedTasks);
                setCompletedTasks(completedTasks); // 状態を更新
            }

          router.push("/")
        }).catch((error) => {
            if(error.code === "auth/user-not-found"){
                alert("そのようなユーザは存在しません")
            }else{
                alert(error.message)
            }
        })
    }


  return (
    <div className='h-screen flex flex-col items-center justify-center'>
        <div className='flex justify-center items-center w-full'>
        <div className='bg-white mb-8 w-1/2 p-10 flex justify-around  mx-10 '>       
            <p className='mb-3'>ランサーズ掲載「音声チャットボットを使った調べ物タスク」開始にあたって
             本ウェブサイトは，ランサーズにて掲載中の音声チャットボットを使った調べ物タスクを行うためのサイトです．
             <br />本タスクは，兵庫県立大学大島・山本研究室が実施する研究プロジェクトの一環として行われます． 
             <br />本タスクでは，タスク依頼者が用意した音声チャットボットを用いて調べ物をしながら，あるトピックに対する調べたことをまとめていただきます．
             <br/>本タスクは，2つのトピックについて音声チャットボットと会話をしながら調べ物をしていただきます． 
             調べ物が終了後，トピックについてあなたの調べた結果やシステムに関するアンケートに答えていただきます．
             全てのタスクの調べ物が終了後，年代や性別などの属性情報をお伺いします．
             <br />本タスクに参加いただくかどうかは任意で強制でありません． 
             また，いつでもタスクの途中で参加をやめることができますが， タスクを途中でやめると，タスクの報酬を受け取ることはできませんのでご留意ください．
             <br />本タスクはPCのみで行うことができます．スマートフォンやタブレットからご参加することはできません．
             <br />本タスクでは，アンケートに回答いただいいた内容や，タスク中の音声のチャットボットとのやり取りのログを記録させていただきます． ただし，音声の録音は致しません．
             <br />収集したデータは匿名化されており，学術研究活動以外の目的で使用することはありません． 
             <br />本タスクについて何か質問があれば，ランサーズID sis_tyamamot までタスク前，タスク中，タスク後いつでも連絡できます．
             以上をお読みになり同意いただける方のみ，ログインボタンをクリックしてタスクを開始してください．</p>
        </div>
        <div className='w-1/2 p-4'>
        <form onSubmit={handleSubmit(onSubmit)} className='bg-white p-8 rounded-lg shadow-md w-96'>
   
            {/* <h1 className='mb-4 text-2xl text-gray-700 font-medium'>ログイン</h1> */}
           
            <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-600'>Email</label>
                <input  {...register("email",{
                    required:"メールアドレスは必須です",
                    pattern: {
                        value: 
                        /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                        message:"不適切なメールアドレスです",
                    }
                })}
                type="text" className='mt-1 border-2 rounded-md w-full p-2'/>
                {errors.email && (
                    <span className='text-red-600 text-sm'>{errors.email.message}</span>
                )}
            </div>
            <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-600'>Password</label>
                <input  {...register("password",{
                    required:"パスワードは必須です",
                    minLength: {
                        value:6,
                        message:"6文字以上入力してください"
                    }
                })}
                 type="password" className='mt-1 border-2 rounded-md w-full p-2'/>
                {errors.password && (
                    <span className='text-red-600 text-sm'>{errors.password.message}</span>
                )}
            </div>

            <div className='flex justify-end'>
                <button 
                type="submit"
                className='bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700'>ログイン</button>
            </div>
            <Link href={"/auth/register"}className='text-blue-500 text-sm font-bold ml-1 hidden'>初めてのご利用の方はこちら</Link>
        </form>
        </div>
        </div>
    </div>
  )
}

export default Login