import { useState } from "react";
import { API_URL } from "../lib/config";
import { getToken, getUserId } from "../lib/auth";
import imageCompression from 'browser-image-compression';

interface CreatePostData {
    title: string;
    content: string;
    category: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    imageFile?: File;
    neighborhood?: string;
    city?: string;
    country?: string;
}

export function useCreatePost() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);



    // ... existing code ...

    const createPost = async (data: CreatePostData) => {
        const token = getToken();
        if (!token) {
            throw new Error("You must be logged in to post.");
        }

        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content || "");
            formData.append('category', data.category);
            formData.append('latitude', data.latitude.toString());
            formData.append('longitude', data.longitude.toString());
            if (data.neighborhood) formData.append('neighborhood', data.neighborhood);
            if (data.city) formData.append('city', data.city);
            if (data.country) formData.append('country', data.country);

            if (data.imageFile) {
                console.log(`Original size: ${data.imageFile.size / 1024 / 1024} MB`);

                const options = {
                    maxSizeMB: 0.5, // 500KB max
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: "image/jpeg"
                };

                try {
                    const compressedFile = await imageCompression(data.imageFile, options);
                    console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);

                    // IMPORTANT: Pass the filename, otherwise it might be 'blob' and fail extname check
                    formData.append('file', compressedFile, data.imageFile.name);
                } catch (error) {
                    console.error("Compression failed, using original", error);
                    formData.append('file', data.imageFile, data.imageFile.name);
                }
            }

            const res = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create post");
            }

            return true;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createPost, loading, error };
}
