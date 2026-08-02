"use client";

import toast from "react-hot-toast";
import { CircleAlert } from "lucide-react";

export const showToast = (message: string) => {
  toast.custom(
    (t) => (
      <div
        className={`
            w-full px-5 h-14
            flex items-center justify-center gap-1.5 bg-semantic-900 text-semantic-100 
            rounded-full shadow-lg text-b1 font-medium
            transition-all duration-200 ease-in-out
            ${t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}
        `}
      >
        <CircleAlert
          className="size-5 shrink-0 fill-white text-black"
          strokeWidth={3}
        />
        <span>{message}</span>
      </div>
    ),
    {
      id: message,
      duration: 2000,
    },
  );
};
