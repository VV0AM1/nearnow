import { Variants } from "framer-motion";

export const backdropVariants: Variants = {
    closed: { opacity: 0, backdropFilter: "blur(0px)" },
    open: {
        opacity: 1,
        backdropFilter: "blur(12px)",
        transition: { duration: 0.4 }
    }
};

export const containerVariants: Variants = {
    closed: {
        opacity: 0,
        y: "100%",
        transition: {
            type: "spring", stiffness: 400, damping: 40
        }
    },
    open: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring", stiffness: 400, damping: 40,
            delayChildren: 0.1,
            staggerChildren: 0.1
        }
    }
};

export const itemVariants: Variants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
};
