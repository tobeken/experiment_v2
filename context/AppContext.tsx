'use client'

import { auth } from "@/app/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

type AppProviderProps = {
    children:ReactNode
}

type AppContextType = {
    user: User | null;
    userId:string | null;
    setUser:React.Dispatch<React.SetStateAction< User | null>>;
    selectedRoom:string | null;
    setSelectedRoom:React.Dispatch<React.SetStateAction< string | null>>;
    selectRoomName:string | null;
    setSelectRoomName:React.Dispatch<React.SetStateAction< string | null>>;
    completedTasks: { [key: string]: boolean }; // 完了したタスクの状態を管理するオブジェクト
    setCompletedTasks: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>; // 状態を更新する関数
    currentTask: string; // 現在のタスク名
    setCurrentTask: React.Dispatch<React.SetStateAction<string>>; // タスク名を更新する関数
    showTasks: boolean;
    setShowTasks: React.Dispatch<React.SetStateAction<boolean>>;
}

const defautContextData = {
    user:null,
    userId:null,
    setUser:() => {},
    selectedRoom:null,
    setSelectedRoom: () => {},
    selectRoomName:null,
    setSelectRoomName: () => {},
    showTasks: false,
    setShowTasks: () => {},
    completedTasks: {}, // 空のオブジェクトで初期化    completedTasks: {}, // 空のオブジェクトで初期化
    setCompletedTasks: () => {}, // 空の関数で初期化
    currentTask: '事前タスク', // 初期値として事前タスクを設定
    setCurrentTask: () => {}, // 空の関数で初期化

}

const AppContext = createContext<AppContextType>(defautContextData);

export function AppProvider({children}:AppProviderProps){
    const [user,setUser] = useState<User | null>(null);
    const [userId,setUserId] = useState<string | null>(null);
    const [selectedRoom,setSelectedRoom] = useState<string | null>(null);
    const [selectRoomName,setSelectRoomName] = useState<string | null>(null);
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
    const [currentTask, setCurrentTask] = useState<string>('事前タスク');
    const [showTasks, setShowTasks] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,(newUser) => {
            setUser(newUser);
            setUserId(newUser ? newUser.uid : null);
        });

        return () => {
            unsubscribe();
        }
    },[])

    return <AppContext.Provider value={{user,userId,setUser,selectedRoom,setSelectedRoom,selectRoomName,setSelectRoomName,
        completedTasks,
        setCompletedTasks,currentTask,
        setCurrentTask, showTasks,
        setShowTasks}}>{children}</AppContext.Provider>
}

export function useAppContext(){
    return useContext(AppContext)
}