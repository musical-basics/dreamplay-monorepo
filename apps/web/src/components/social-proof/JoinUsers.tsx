import React from "react";

const JoinUsers = () => {
    return (
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-yellow-100/50 border border-yellow-200 text-yellow-800 text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-500">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                    Join 1,000+ users in the waitlist
                </span>
            </div>
        </div>
    );
};

export default JoinUsers;
