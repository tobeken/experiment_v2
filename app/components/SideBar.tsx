'use client'

import React, { useEffect, useState } from 'react'
import { CiLogout } from "react-icons/ci";
import { auth, db } from '../firebase';
import { Timestamp, addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, getDocs,where, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '@/context/AppContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Room = {
    id: string;
    name: string;
    createdAt: Timestamp;
}

const deleteDuplicateRooms = async (userId: string) => {
    const userRoomsCollectionRef = collection(db, "users", userId, "rooms");
    const initialRooms = ["事前タスク","タスク1","タスク2"];
    const roomsSnapshot = await getDocs(userRoomsCollectionRef);
    const roomCounts = roomsSnapshot.docs.reduce((acc: Record<string, number>, doc) => {
        const name = doc.data().name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});

    for (const roomName of initialRooms) {
        if (roomCounts[roomName] > 1) {
            const duplicateRooms = roomsSnapshot.docs.filter(doc => doc.data().name === roomName);
            for (let i = 1; i < duplicateRooms.length; i++) {
                await deleteDoc(duplicateRooms[i].ref);
            }
        }
    }
};


const SideBar = () => {
    const { user, userId, setSelectedRoom, setSelectRoomName,showTasks,currentTask } = useAppContext();
    const [rooms, setRooms] = useState<Room[]>([])

    useEffect(() => {
        const fetchRooms = async () => {
            if (!userId) return;
            const userRoomsCollectionRef = collection(db, "users", userId, "rooms");
            const q = query(userRoomsCollectionRef, orderBy("createdAt"));

            // 初期ルームを追加
            const addInitialRooms = async () => {
                const initialRooms = ["事前タスク","タスク1","タスク2"];
                const userDocRef = doc(db, "users", userId);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // ユーザードキュメントが存在しない場合、新規作成
                    await setDoc(userDocRef, { initialized: true });

                    for (const roomName of initialRooms) {
                        await addDoc(userRoomsCollectionRef, {
                            name: roomName,
                            createdAt: serverTimestamp(),
                        });
                    }
                }
            };

            await addInitialRooms();
            await deleteDuplicateRooms(userId);

            // リアルタイムのスナップショットを取得
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const newRooms: Room[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name,
                    createdAt: doc.data().createdAt,
                })); // currentTaskと等しい名前のルームのみをフィルタリング;
                setRooms(newRooms);

                // ログイン直後に事前タスクを選択
                if (newRooms.length > 0) {
                    const initialRoom = newRooms.find(room => room.name === "事前タスク");
                    if (initialRoom) {
                        setSelectedRoom(initialRoom.id);
                        setSelectRoomName(initialRoom.name);
                                    }
                    }
            });

            

            return () => {
                unsubscribe();
            };
        };

        fetchRooms();
    }, [userId]);

    const selectRoom = (roomId: string, roomName: string) => {
        setSelectedRoom(roomId);
        setSelectRoomName(roomName)
    };

    const handleLogout = () => {
        auth.signOut();
    }

    return (
        <div className='bg-custom-blue h-full overflow-y-auto  px-5 flex flex-col '>
            <div className='flex-grow'>

                <ul>
                    {rooms.map((room) => {
                            if (currentTask !== room.name) {
                                return null; // currentTaskと一致しない場合は表示しない
                            }
                        // if (showTasks && (room.name === "タスク1" || room.name === "タスク2" || room.name === "タスク3")) {
                        //     return null;
                        // }
                        return (
                            <li
                                key={room.id}
                                className='cursor-pointer border-b p-4 text-slate-100 hover:bg-slate-700 duration-150'
                                onClick={() => selectRoom(room.id, room.name)}
                            >
                                {room.name}
                            </li>
                        );
                    })}
                </ul>
            </div>
            {user && (
                <div className='mb-2 p-4 text-slate-100 text-lg font-medium'>{user.email}</div>
            )}
            <div onClick={handleLogout} className='text-lg flex items-center justify-evenly mb-2 cursor-pointer p-4 text-slate-100 hover:bg-slate-700 duration-150'>
                <CiLogout />
                <span>ログアウト</span>
            </div>
        </div>
    )
}

export default SideBar
