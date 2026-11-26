const capabilities = [
  { label: 'Project Setup', value: 'Organized', sub: 'Projects, budgets, and contractors' },
  { label: 'Task Tracking', value: 'Deadline-aware', sub: 'Assignments, priorities, and progress' },
  { label: 'Work Reporting', value: 'Documented', sub: 'Daily, delay, and completion reports' },
  { label: 'Material Requests', value: 'Reviewable', sub: 'Requests routed to project managers' },
];

export function CapabilitiesSection() {
  return (
    <section id="metrics" className="border-b border-slate-800 bg-slate-900 py-12 text-white">
      <div className="mx-auto max-w-[1600px] px-3">
        <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
          {capabilities.map((capability) => (
            <div
              key={capability.label}
              className="space-y-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-4"
            >
              <div className="text-xl font-black text-amber-400 sm:text-2xl">
                {capability.value}
              </div>
              <div className="text-xs font-bold text-slate-200">{capability.label}</div>
              <div className="text-[11px] text-slate-400">{capability.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
