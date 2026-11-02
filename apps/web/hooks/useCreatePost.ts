import { useState } from "react";
import { API_URL } from "../lib/config";
import { getToken } from "../lib/auth";
import imageCompression from 'browser-image-compression';

interface CreatePostData {
    title: string;
    content: string;
    category: string;
    latitude: number;
    longitude: number;
    imageFile?: File;
    approximateLocation?: boolean;
    lostFound?: { direction: "LOST" | "FOUND"; itemType: string; occurredFrom: string; occurredTo: string };
}

export interface CreatedPost {
    id: string;
    alertSummary?: { notified: number; pushDelivered: number };
    [key: string]: unknown;
}

export function useCreatePost() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Posts multipart/form-data; the server derives the neighbourhood and strips image metadata. */
    const createPost = async (data: CreatePostData): Promise<CreatedPost> => {
        const token = getToken();
        if (!token) {
            throw new Error("You must be logged in to post.");
        }

        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            if (data.content?.trim()) formData.append('content', data.content.trim());
            formData.append('category', data.category);
            formData.append('latitude', data.latitude.toString());
            formData.append('longitude', data.longitude.toString());
            if (data.approximateLocation !== undefined) formData.append('approximateLocation', String(data.approximateLocation));
            if (data.category === 'LOST_FOUND' && data.lostFound) {
                formData.append('lostFoundDirection', data.lostFound.direction);
                formData.append('lostFoundItemType', data.lostFound.itemType);
                formData.append('occurredFrom', data.lostFound.occurredFrom);
                formData.append('occurredTo', data.lostFound.occurredTo);
            }

            if (data.imageFile) {
                const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/jpeg" };
                try {
                    const compressedFile = await imageCompression(data.imageFile, options);
                    formData.append('file', compressedFile, 'photo.jpg');
                } catch {
                    formData.append('file', data.imageFile, data.imageFile.name);
                }
            }

            const res = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });

            const body = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = body?.message;
                throw new Error(Array.isArray(msg) ? msg.join("\n") : msg || "Failed to create post");
            }
            return body as CreatedPost;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createPost, loading, error };
}
