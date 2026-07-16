import { Suspense } from "react";
import DSStandardContent from "./content";

export default function DSStandardPage() {
    return (
        <Suspense fallback={null}>
            <DSStandardContent />
        </Suspense>
    );
}