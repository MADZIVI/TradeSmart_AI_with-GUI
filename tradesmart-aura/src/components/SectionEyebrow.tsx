export default function SectionEyebrow({
  label,
  tag,
}: {
  label: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-2 text-white/70 text-sm font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        {label}
      </span>
      {tag && (
        <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">
          {tag}
        </span>
      )}
    </div>
  );
}
