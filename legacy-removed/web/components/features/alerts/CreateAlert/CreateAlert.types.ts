export interface CreateAlertProps {
    isOpen: boolean;
    onClose: () => void;
    userLocation: { lat: number; long: number };
}

export interface AlertFormData {
    title: string;
    content: string;
    category: string;
    imageFile: File | null;
    location: { lat: number; long: number };
}

export const ALERT_CATEGORIES = [
    "GENERAL",
    "CRIME",
    "SAFETY",
    "LOST_FOUND",
    "EVENT",
    "RECOMMENDATION"
];
