"use client";
import React, { useState } from "react";
import type { FAQItem } from "@/actions/faq-data";

export default function FAQList({ items }: { items: FAQItem[] }) {
    // We use the ID to track which is open instead of the index, to prevent bugs when mapping groups
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    // 1. Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, FAQItem[]>);

    // 2. Define the desired display order of categories
    const categoryOrder = [
        "The Science & Research",
        "The Pianist's Experience",
        "DreamPlay & Ordering",
        "General"
    ];

    // 3. Sort categories based on preferred order
    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className="space-y-24">
            {sortedCategories.map(category => (
                <div key={category} className="scroll-mt-32" id={category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>

                    {/* Category Header */}
                    <div className="mb-10 border-b border-neutral-200 pb-4">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-2">Category</p>
                        <h2 className="font-serif text-3xl md:text-4xl text-black tracking-tight">{category}</h2>
                    </div>

                    {/* Questions inside Category */}
                    <div className="divide-y divide-neutral-200 border-t border-neutral-200">
                        {(groupedItems[category] ?? []).map((item, index) => {
                            const uniqueId = item.id || `${category}-${index}`;
                            const isOpen = openId === uniqueId;

                            return (
                                <div key={uniqueId} className="group">
                                    <button
                                        onClick={() => toggle(uniqueId)}
                                        className="w-full flex items-center justify-between py-6 md:py-8 text-left transition-colors hover:bg-neutral-50 px-2 cursor-pointer"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="font-serif text-lg md:text-xl text-neutral-900 pr-8 leading-snug">
                                            {item.question}
                                        </span>
                                        <span className={`text-neutral-400 text-3xl font-light shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45 text-black' : ''}`}>
                                            +
                                        </span>
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-500 ease-in-out px-2 ${isOpen ? 'max-h-[5000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div
                                            className="font-sans text-sm md:text-base text-neutral-600 leading-relaxed pr-8 md:pr-12 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_a]:transition-colors [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:mb-2 [&_strong]:text-neutral-900"
                                            dangerouslySetInnerHTML={{ __html: item.answer }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
