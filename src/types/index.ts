export interface CustomDesign {
    id: string;
    imageUrl: string;
    imageFile: File;
    thumbnail: string;
}

export interface CartItem {
    id: string;
    design: CustomDesign;
    quantity: number;
    price: number;
}

export interface CheckoutData {
    email: string;
    items: CartItem[];
    total: number;
}
