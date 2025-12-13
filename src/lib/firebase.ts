import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAdeQrlo5zwhLiPmHqO45MxK9wXTNGRL4I",
    authDomain: "aluratapes.firebaseapp.com",
    projectId: "aluratapes",
    storageBucket: "aluratapes.firebasestorage.app",
    messagingSenderId: "969885007560",
    appId: "1:969885007560:web:e0b02b881c42faed0deffd",
    measurementId: "G-91SJ05H5T3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

interface SignupData {
    email: string;
}

interface PreorderData {
    email: string;
    originalImageUrl: string;
    tapePreviewUrl: string;
    quantity: number;
    total: number;
}

export async function saveSignup(data: SignupData) {
    try {
        const docRef = await addDoc(collection(db, "signups"), {
            ...data,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving signup:", error);
        return { success: false, error };
    }
}

export async function savePreorder(data: PreorderData) {
    try {
        const docRef = await addDoc(collection(db, "preorders"), {
            ...data,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving preorder:", error);
        return { success: false, error };
    }
}

