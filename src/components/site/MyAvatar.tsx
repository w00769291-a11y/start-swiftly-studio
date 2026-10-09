import { useMyProfile } from "@/lib/my-profile";
import { cn } from "@/lib/utils";

export function MyAvatar({ size, className }: { size: number; className?: string }) {
  const { photo, initial, hue } = useMyProfile();
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, background: `oklch(0.5 0.14 ${hue})`, fontSize: Math.max(11, size * 0.34) }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full rounded-full object-cover" /> : initial}
    </span>
  );
}
