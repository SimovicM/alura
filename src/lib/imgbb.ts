const IMGBB_API_KEY = 'cc2608698b8700fefed913b6ecb15c3c';

export async function uploadToImgBB(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

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
