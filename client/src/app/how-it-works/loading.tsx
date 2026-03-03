export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
    </div>
  );
}
