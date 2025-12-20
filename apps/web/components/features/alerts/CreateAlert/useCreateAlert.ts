import { useState, useEffect } from "react";
import { useCreatePost } from "../../../../hooks/useCreatePost";
import { useReverseGeocode } from "../../../../hooks/useReverseGeocode";
import { AlertFormData } from "./CreateAlert.types";

export function useCreateAlert(initialLocation: { lat: number; long: number }, onClose: () => void) {
    const { createPost, loading: submitting } = useCreatePost();
    const { address: addressDisplay, setAddress: setAddressDisplay, reverseGeocode } = useReverseGeocode();

    const [formData, setFormData] = useState<Omit<AlertFormData, 'location' | 'imageFile'> & { imageFile: File | null }>({
        title: "",
        content: "",
        category: "GENERAL",
        imageFile: null
    });

    // Manage location separately as it has complex interaction
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);
    const [isPickingLocation, setIsPickingLocation] = useState(false);

    // Initial reverse geocode
    useEffect(() => {
        if (initialLocation.lat && initialLocation.long && !addressDisplay) {
            reverseGeocode(initialLocation.lat, initialLocation.long);
        }
    }, [initialLocation, reverseGeocode]);

    const updateField = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationSelect = (lat: number, long: number, displayName?: string) => {
        setSelectedLocation({ lat, long });
        if (displayName) {
            setAddressDisplay(displayName);
        } else {
            setAddressDisplay("Fetching address...");
            reverseGeocode(lat, long);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPost({
                ...formData,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.long,
                imageFile: formData.imageFile || undefined
            });

            // Persist location
            localStorage.setItem("userLocation", JSON.stringify(selectedLocation));

            onClose();
            window.location.reload();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return {
        formData,
        updateField,
        selectedLocation,
        setSelectedLocation,
        isPickingLocation,
        setIsPickingLocation,
        handleLocationSelect,
        handleSubmit,
        submitting,
        addressDisplay
    };
}
