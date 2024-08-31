'use client'

import { Timestamp } from "firebase/firestore";
import { useEffect } from "react"

type Message = {
    text: string;
    sender: string;
    createdAt:Timestamp;
}

