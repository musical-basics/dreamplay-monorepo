"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { subscribeToNewsletter } from "@/actions/email-actions";

interface ProductSelectionFormProps {
    className?: string;
}

export default function ProductSelectionForm({ className }: ProductSelectionFormProps) {
    return (
        <div className={`w-full max-w-4xl mx-auto flex justify-center ${className}`}>
            <a
                href="https://dreamplay-pianos.myshopify.com/cart/clear?return_to=/cart/52240288776506:1"
                className="bg-black text-white px-12 py-5 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl w-full max-w-sm text-center"
            >
                Lock In Our Best Price ($1)
            </a>
        </div>
    );
}
