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
}

const defautContextData = {
    user:null,
    userId:null,
    setUser:() => {},
    selectedRoom:null,
    setSelectedRoom: () => {},
    selectRoomName:null,
    setSelectRoomName: () => {},
    completedTasks: {}, // 空のオブジェクトで初期化    completedTasks: {}, // 空のオブジェクトで初期化
    setCompletedTasks: () => {}, // 空の関数で初期化

}

const AppContext = createContext<AppContextType>(defautContextData);

export function AppProvider({children}:AppProviderProps){
    const [user,setUser] = useState<User | null>(null);
    const [userId,setUserId] = useState<string | null>(null);
    const [selectedRoom,setSelectedRoom] = useState<string | null>(null);
    const [selectRoomName,setSelectRoomName] = useState<string | null>(null);
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

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
        setCompletedTasks,}}>{children}</AppContext.Provider>
}

export function useAppContext(){
    return useContext(AppContext)
}