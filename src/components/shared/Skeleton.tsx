import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard({height}:{height:number}) {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton style={{ height: `${height}px` }} className="w-full rounded-xl" />
    </div>
  );
}