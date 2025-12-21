import { Camera } from "lucide-react";
import { ALERT_CATEGORIES, AlertFormData } from "./CreateAlert.types";

interface AlertFormProps {
    title: string;
    content: string;
    category: string;
    imageFile: File | null;
    onChange: (field: Exclude<keyof AlertFormData, 'location'>, value: any) => void;
}

export function AlertForm({ title, content, category, onChange }: AlertFormProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                    value={title}
                    onChange={(e) => onChange("title", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Lost Dog on 4th St"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {ALERT_CATEGORIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onChange("category", c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${category === c
                                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    value={content}
                    onChange={(e) => onChange("content", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                    placeholder="Details about the incident..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Photo (Optional)</label>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onChange("imageFile", e.target.files[0]);
                            }
                        }}
                        className="w-full text-sm text-foreground
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                </div>
            </div>
        </div>
    );
}
