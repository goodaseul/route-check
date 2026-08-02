"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Menu, X } from "lucide-react";
import type { ScheduleItem } from "../../_context/PlanScheduleContext";

type SortableScheduleItemProps = {
  item: ScheduleItem;
  order: number;
  isLast: boolean;
  onRemove: (id: string) => void;
};

export default function SortableScheduleItem({
  item,
  order,
  isLast,
  onRemove,
}: SortableScheduleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <div className="flex min-h-16 items-center bg-semantic-300 px-5">
        <button
          type="button"
          aria-label={`${item.name} 순서 변경`}
          className="mr-3 touch-none cursor-grab text-semantic-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>

        <span className="center size-5 shrink-0 rounded-full bg-semantic-900 text-d1 font-semibold text-semantic-100">
          {order}
        </span>
        <strong className="ml-2 flex-1 text-b1 font-semibold text-semantic-800">
          {item.name}
        </strong>

        <button
          type="button"
          aria-label={`${item.name} 삭제`}
          onClick={() => onRemove(item.id)}
          className="ml-3 text-semantic-500 transition-colors hover:text-semantic-700"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {!isLast && (
        <div className="flex h-12 items-center pl-13 text-d1 text-semantic-600">
          {item.travelTime || "대중교통 25분 소요"}
        </div>
      )}
    </li>
  );
}
