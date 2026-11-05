export default function TagGroupList({ 
  groups 
}: { 
  groups: Array<{ id: string; name: string }> 
}) {
  if (groups.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-2 text-gray-900 dark:text-zinc-100">
        Nhóm tag
      </h4>
      <div className="flex gap-2 flex-wrap">
        {groups.map((g) => (
          <div 
            key={g.id} 
            className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-default"
          >
            {g.name}
          </div>
        ))}
      </div>
    </div>
  );
}