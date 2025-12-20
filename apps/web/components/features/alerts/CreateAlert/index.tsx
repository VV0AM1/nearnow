"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { CreateAlertProps } from "./CreateAlert.types";
import { useCreateAlert } from "./useCreateAlert";
import { AlertForm } from "./AlertForm";
import { LocationPicker } from "./LocationPicker";

export default function CreateAlertModal({ isOpen, onClose, userLocation }: CreateAlertProps) {
    const {
        formData,
        updateField,
        selectedLocation,
        isPickingLocation,
        setIsPickingLocation,
        handleLocationSelect,
        handleSubmit,
        submitting,
        addressDisplay
    } = useCreateAlert(userLocation, onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="glass-card max-w-lg w-full p-6 border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <AlertTriangle className="text-primary h-6 w-6" />
                    Create Neighborhood Alert
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AlertForm
                        title={formData.title}
                        content={formData.content}
                        category={formData.category}
                        imageFile={formData.imageFile}
                        onChange={updateField}
                    />

                    <LocationPicker
                        isPicking={isPickingLocation}
                        setIsPicking={setIsPickingLocation}
                        selectedLocation={selectedLocation}
                        onLocationSelect={handleLocationSelect}
                        addressDisplay={addressDisplay}
                        biasLocation={userLocation}
                    />

                    {!isPickingLocation && (
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Post Alert"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
