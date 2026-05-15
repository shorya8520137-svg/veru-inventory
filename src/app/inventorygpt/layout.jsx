'use client';

export default function InventoryGPTLayout({ children }) {
  return (
    <div
      data-inventorygpt-shell
      className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fc] text-slate-900"
    >
      {children}
    </div>
  );
}
