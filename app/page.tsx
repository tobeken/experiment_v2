'use client'

import Image from "next/image";
import SideBar from "./components/SideBar";
import Chat from "./components/Chat3";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { user } = useAppContext();
  const router = useRouter();
  

  if(!user){
    router.push('/auth/login')
  }

  return (
 <div className="flex h-screen justify-center items-center">
  <div className="h-full flex" style={{width:"1366px"}}>
    <div className="w-1/5 h-full border-r">
      <SideBar />
    </div>
    <div className="w-4/5 h-full">
      <Chat  />
    </div>
  </div>
 </div>
  );
}
