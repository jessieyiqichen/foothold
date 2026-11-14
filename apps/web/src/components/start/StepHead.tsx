import { ScreenHeading } from "@/components/ui/ScreenHeading";
import { Shape, type ShapeName, type TileColor } from "@/components/ui/art/Shape";

interface StepHeadProps {
  title: string;
  /** The one sentence under the heading. */
  line?: string;
  shape: ShapeName;
  color: TileColor;
  tile: TileColor;
}

/** A step's heading, its one sentence and its shape (the first visit is front-facing, so it carries one). The heading
 *  takes focus when the step appears, so keyboard and screen reader users land on it. */
export function StepHead({ title, line, shape, color, tile }: StepHeadProps) {
  return (
    <div className="flex items-start gap-4">
      <Shape shape={shape} color={color} tile={tile} size={48} className="mt-1 shrink-0 -rotate-[3deg]" />
      <div className="flex min-w-0 flex-col gap-2">
        <ScreenHeading id="start-step" className="text-3xl leading-tight font-black tracking-[-0.03em] text-ink">{title}</ScreenHeading>
        {line && <p className="font-mono text-xs leading-5 text-muted">{line}</p>}
      </div>
    </div>
  );
}
