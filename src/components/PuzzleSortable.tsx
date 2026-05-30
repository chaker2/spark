import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export type PuzzleItem = { id: string; text: string };

function SortableRow({
  item,
  index,
  total,
  disabled,
  onMove,
}: {
  item: PuzzleItem;
  index: number;
  total: number;
  disabled: boolean;
  onMove: (i: number, dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-card rounded-2xl border-2 p-2 transition-shadow ${
        isDragging ? "border-primary shadow-float" : "border-border"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label="Déplacer"
        className="h-10 w-8 shrink-0 grid place-items-center text-muted-foreground touch-none cursor-grab active:cursor-grabbing disabled:opacity-30"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="h-10 w-10 shrink-0 rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold grid place-items-center">
        {index + 1}
      </span>
      <span className="flex-1 font-semibold break-words">{item.text}</span>
      <button
        type="button"
        onClick={() => onMove(index, -1)}
        disabled={index === 0 || disabled}
        className="h-10 w-10 rounded-xl border-2 border-border grid place-items-center disabled:opacity-30"
        aria-label="Monter"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1 || disabled}
        className="h-10 w-10 rounded-xl border-2 border-border grid place-items-center disabled:opacity-30"
        aria-label="Descendre"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PuzzleSortable({
  items,
  disabled,
  onReorder,
}: {
  items: PuzzleItem[];
  disabled: boolean;
  onReorder: (items: PuzzleItem[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  const move = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= items.length) return;
    onReorder(arrayMove(items, i, ni));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, i) => (
            <SortableRow
              key={item.id}
              item={item}
              index={i}
              total={items.length}
              disabled={disabled}
              onMove={move}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
