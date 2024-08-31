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
    showTasks: boolean;
    setShowTasks: React.Dispatch<React.SetStateAction<boolean>>;
    currentTask: string; // 現在のタスク名
    setCurrentTask: React.Dispatch<React.SetStateAction<string>>; // タスク名を更新する関数
    completedTasks: { [key: string]: boolean }; // 完了したタスクの状態を管理するオブジェクト
    setCompletedTasks: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>; // 状態を更新する関数
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
    currentTask: '事前タスク', // 初期値として事前タスクを設定
    setCurrentTask: () => {}, // 空の関数で初期化
    completedTasks: {}, // 空のオブジェクトで初期化
    setCompletedTasks: () => {}, // 空の関数で初期化

}

const AppContext = createContext<AppContextType>(defautContextData);

export function AppProvider({children}:AppProviderProps){
    const [user,setUser] = useState<User | null>(null);
    const [userId,setUserId] = useState<string | null>(null);
    const [selectedRoom,setSelectedRoom] = useState<string | null>(null);
    const [selectRoomName,setSelectRoomName] = useState<string | null>(null);
    const [showTasks, setShowTasks] = useState<boolean>(false);
    const [currentTask, setCurrentTask] = useState<string>('事前タスク');
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,(newUser) => {
            setUser(newUser);
            setUserId(newUser ? newUser.uid : null);

                    // ログイン時にローカルストレージからcompletedTasksを読み込む
        if (newUser) {
            const storedCompletedTasks = localStorage.getItem('completedTasks');
            if (storedCompletedTasks) {
                setCompletedTasks(JSON.parse(storedCompletedTasks));
            }
        }

            
        });

        return () => {
            unsubscribe();
        }
    },[])

    return <AppContext.Provider value={{user,userId,setUser,selectedRoom,setSelectedRoom,selectRoomName,setSelectRoomName,
        showTasks,
        setShowTasks,currentTask,
        setCurrentTask,completedTasks,
        setCompletedTasks,}}>{children}</AppContext.Provider>
}

export function useAppContext(){
    return useContext(AppContext)
}