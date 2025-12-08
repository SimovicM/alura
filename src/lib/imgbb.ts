const IMGBB_API_KEY = 'cc2608698b8700fefed913b6ecb15c3c';

// Upload a file to ImgBB with optional custom name
export async function uploadToImgBB(file: File, customName?: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    if (customName) {
        formData.append('name', customName);
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('ImgBB upload failed');
    }

    const data = await response.json();

    if (data.success) {
        return data.data.url;
    } else {
        throw new Error('ImgBB upload failed');
    }
}

// Upload a base64 data URL to ImgBB
export async function uploadBase64ToImgBB(base64DataUrl: string, customName?: string): Promise<string> {
    // Remove the data URL prefix to get just the base64 string
    const base64 = base64DataUrl.split(',')[1];

    const formData = new FormData();
    formData.append('image', base64);
    if (customName) {
        formData.append('name', customName);
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('ImgBB upload failed');
    }

    const data = await response.json();

    if (data.success) {
        return data.data.url;
    } else {
        throw new Error('ImgBB upload failed');
    }
}

// Generate a unique ID for naming
export function generateUniqueId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
