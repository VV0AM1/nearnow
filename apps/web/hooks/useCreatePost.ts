import { useState } from "react";
import { getToken, getUserId } from "../lib/auth";

interface CreatePostData {
    title: string;
    content: string;
    category: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    imageFile?: File;
}

export function useCreatePost() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            // formData.append('authorId', getUserId() || "demo-user"); // authorId is handled by backend or separate field if needed, but here we usually pass it in body if guard is off. 
            // Controller expects authorId in Body currently (from my previous edits).
            formData.append('authorId', getUserId() || "demo-user");

            if (data.imageFile) {
                formData.append('file', data.imageFile);
            }

            const res = await fetch("http://localhost:3002/posts", {
                method: "POST",
                headers: {
                    // "Content-Type": "multipart/form-data" // Browser sets this automatically
                    // "Authorization": `Bearer ${token}` 
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
