import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, doc, updateDoc } from "firebase/firestore";

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

// --- Types ---
export interface SignupData {
    email: string;
}

export interface PreorderData {
    email: string;
    originalImageUrl?: string;
    tapePreviewUrl?: string;
    productId?: string;
    productName?: string;
    productImage?: string;
    quantity: number;
    total: number;
    couponCode?: string;
    couponApplied?: boolean;
    discountAmount?: number;
}

export interface Coupon {
    id?: string;
    code: string;
    percent: number; // percent discount (e.g. 10 for 10%)
    active?: boolean;
}

export interface Product {
    id?: string;
    name: string;
    imageUrl: string;
    price: number;
    preorder?: boolean;
    createdAt?: any;
}

// --- Signups ---
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

// --- Preorders ---
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

export async function addCoupon(data: Coupon) {
    try {
        const docRef = await addDoc(collection(db, "coupons"), {
            code: data.code,
            percent: data.percent,
            active: data.active ?? true,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding coupon:', error);
        return { success: false, error };
    }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
    try {
        const snapshot = await getDocs(collection(db, 'coupons'));
        let found: Coupon | null = null;
        snapshot.forEach(docSnap => {
            const data = docSnap.data() as any;
            if (String(data.code).toLowerCase() === code.toLowerCase() && data.active) {
                found = { id: docSnap.id, code: data.code, percent: data.percent, active: data.active };
            }
        });
        return found;
    } catch (error) {
        console.error('Error fetching coupon:', error);
        return null;
    }
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const products: Product[] = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data() as any;
            products.push({ id: docSnap.id, name: data.name, imageUrl: data.imageUrl, price: data.price, preorder: !!data.preorder, createdAt: data.createdAt });
        });
        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function addProduct(data: Product) {
    try {
        const docRef = await addDoc(collection(db, "products"), {
            name: data.name,
            imageUrl: data.imageUrl,
            price: data.price,
            preorder: data.preorder ?? true,
            createdAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, error };
    }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    try {
        const ref = doc(db, "products", id);
        await updateDoc(ref, { ...data });
        return { success: true };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, error };
    }
}


