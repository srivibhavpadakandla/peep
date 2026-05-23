// Sidebar — left nav

const NAV = [
  { id: 'live',     label: 'Live',     icon: 'video' },
  { id: 'agents',   label: 'Agents',   icon: 'brain-circuit' },
  { id: 'inbox',    label: 'Inbox',    icon: 'package' },
  { id: 'alerts',   label: 'Alerts',   icon: 'shield-alert' },
  { id: 'logs',     label: 'Logs',     icon: 'scroll-text' },
  { id: 'usage',    label: 'Usage',    icon: 'gauge' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const CameraRow = ({ cam, isActive, collapsed, onSelect, onRename, onRemove }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(cam.label);
  React.useEffect(() => { setDraft(cam.label); }, [cam.label]);
  const dot = cam.status === 'live' ? '#706b8e' : cam.status === 'idle' ? '#9a9489' : '#c4bfae';

  const commit = () => {
    const v = draft.trim();
    if (v && v !== cam.label) onRename(cam.id, v);
    else setDraft(cam.label);
    setEditing(false);
  };

  return (
    <div className={'group relative w-full rounded-md transition-colors flex items-center ' +
        (collapsed ? 'justify-center h-8 px-0' : 'gap-2.5 px-2 py-1.5 ') +
        (isActive ? 'bg-ink-800' : 'hover:bg-ink-800')}>
      <button onClick={() => onSelect(cam.id)}
              className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
              title={collapsed ? cam.label : undefined}>
        <span className="relative inline-flex shrink-0">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
          {cam.status === 'live' && (
            <span className="absolute inset-0 w-1.5 h-1.5 rounded-full pulse-dot"
                  style={{ background: dot, '--pc': hexToRgba(dot, 0.45) }} />
          )}
        </span>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') { setDraft(cam.label); setEditing(false); }
                }}
                onClick={e => e.stopPropagation()}
                className="w-full bg-ink-700 text-[13.5px] text-ink-100 rounded px-1 py-0.5 outline-none"
              />
            ) : (
              <div className="text-[13.5px] text-ink-200 truncate"
                   onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}>
                {cam.label}
              </div>
            )}
            <div className="text-[12px] text-ink-500">{cam.sub}</div>
          </div>
        )}
      </button>
      {!collapsed && !editing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
          <button onClick={e => { e.stopPropagation(); setEditing(true); }}
                  className="p-1 rounded hover:bg-ink-700 text-ink-400 hover:text-ink-200"
                  title="Rename">
            <Icon name="pencil" size={11} />
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove(cam.id); }}
                  className="p-1 rounded hover:bg-ink-700 text-ink-400 hover:text-ink-200"
                  title="Remove">
            <Icon name="x" size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  active, onChange, collapsed, badgeCounts = {},
  cameras = [], activeCameraId,
  onSelectCamera = () => {}, onRenameCamera = () => {},
  onRemoveCamera = () => {}, onAddCamera = () => {},
}) => {
  const [profile, setProfile] = React.useState(() => window.PeepProfile?.get() || { name: 'Jamie Mendoza', email: 'jamie@hello.com' });
  React.useEffect(() => window.PeepProfile?.subscribe(setProfile), []);
  const initials = (profile.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <aside className={'h-full bg-ink-900 flex flex-col hairline-r ' + (collapsed ? 'w-[60px]' : 'w-[208px]')}>
      {/* Brand */}
      <div className={'h-14 flex items-center ' + (collapsed ? 'justify-center' : 'px-5 gap-2.5')}>
        <svg viewBox="0 0 121 174" width="20" height="20" fill="#706b8e" xmlns="http://www.w3.org/2000/svg" aria-label="Peep">
          <path d="M23.85 174c1.02-5.76 2.67-7.93 7.31-10.15h24.11V174H23.85zM91.38 174c-1.02-5.76-2.67-7.93-7.31-10.15H59.96V174h31.42zM44.43 145.36h10.83v20.3H44.43zM59.96 145.36h10.83v20.3H59.96zM66.47 145.36h11.92v10.51H66.47zM.91 76.49h10.29c3.37 36.43 9.8 53.59 43.71 69.42l-10.11 5.8c-33.34-17.05-42.12-34.15-43.89-75.22zM8.32 30.27l6.86 5.8c-4.74 4.18-5.85 12.15-3.97 40.42H.73C-1.39 45.82 1.08 37.7 8.32 30.27zM10.26 55.83c.54-.18 13.66 24.62 34.85 19.93l13.36 13.78C28.65 89.63 18.21 86.95 10.98 77.21c0 0-1.26-21.2-.72-21.39zM22.22 42.05h9.93c-3.15 5.19-4.51 10.53-2.17 23.2-4.84-1.11-6.11-3.03-9.21-8.52-2.64-6.62-.51-10.65 1.45-14.68zM40.32 65.43l-8.35-5.26c3.28-5.11 10.37-4.26 8.35-16.98 5.63 2.3 7.16 5.36 7.72 8.1.09 10-10.01 15.64-7.72 14.14zM28 54.74h10.83l1.27 10.7-10.11-.18L28 54.74zM37.9 56.96s-6.89.23-9.58-2.65c-2.68-2.88-.45-7.49-.45-7.49.86 6.07 3.85 7.74 10.03 10.14zM98.61 42.05h-9.37c2.97 5.19 4.25 10.53 2.04 23.2 4.57-1.11 5.77-3.03 8.69-8.52 2.49-6.62.48-10.65-1.36-14.68zM81.53 65.43l7.88-5.26c-3.1-5.11-9.79-4.26-7.88-16.98-5.31 2.3-6.76 5.36-7.29 8.1-.09 10 9.45 15.64 7.29 14.14zM93.16 54.74H82.93l-1.19 10.7 9.54-.18 1.88-10.52zM83.82 56.96s6.51.23 9.04-2.65c2.53-2.88.42-7.49.42-7.49-.81 6.07-3.63 7.74-9.46 10.14zM110.53 104.4H121V174h-10.47zM57.44 119.63h10.29c11.06 23.75 18.88 35.02 43.53 41.69V174c-32.58-14.48-45.88-26.01-53.82-54.37zM57.44 104.4h10.83v16.49l-10.65-.54-.18-.63V104.4zM90.12 82.29c11.53-3.26 18.18-.98 30.88 22.11h-10.47c-13.68-21.29-31.46-18.73-42.8 0H57.44c8.81-22.92 16.29-26.58 32.68-22.11zM82.9 77.58c15.78-1.31 12.38-2.76 20.76-7.43l.91 13.23-26.55-.91c-4.57-.37-3.5-1.44 4.88-4.9zM106.19 35.89l8.13-5.62c8.8 25.66 8.81 37.83-9.93 51.11l-.72-11.24c9.98-13.37 6.66-20.87 2.53-34.25zM119.19 5.8c-1.91 14.64-7.43 18.52-17.33 25.37-22.3 2.37-28.21 6.13-32.33 15.23H51.84c-5.86-11.26-15.14-12.65-31.6-15.23C5.5 24.12 3.58 17.62.73 5.8V0c20.58 9.09 33.59 8.94 59.23 0 26.23 9.47 39.02 8.91 59.23 0v5.8zm-84.51 10.51l-20.59-1.27 9.39 8.7c23.77 3.24 27.06 3.54 36.84 21.76 6.14-14.3 11.47-17.49 40.81-23.38l5.78-8.34-14.63 2.54L61.23 10.5l-26.55 5.81zM51.66 46.4h17.7c-.59 9.44-.83 15.05-1.99 22.48-1.99 5.39-3.42 7.89-6.86 10.87-4.39-4.36-4.51-6.89-5.96-10.87-.36-1.99-2.13-9.26-2.89-22.48z"/>
        </svg>
        {!collapsed && (
          <span className="text-[16px] text-ink-100">Peep</span>
        )}
      </div>

      {/* Nav */}
      <nav className="px-2">
        {NAV.map(item => {
          const isActive = active === item.id;
          const badge = badgeCounts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={'group w-full h-8 px-2 my-px rounded-md flex items-center gap-2.5 transition-colors relative ' +
                (isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100') +
                (collapsed ? ' justify-center' : '')}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={15} className={isActive ? 'text-ink-100' : 'text-ink-400 group-hover:text-ink-200'} />
              {!collapsed && (
                <>
                  <span className="text-[14px] flex-1 text-left">{item.label}</span>
                  {badge != null && badge.count > 0 && (
                    <span className="text-[12px] text-ink-400 tabular-nums">{badge.count}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cameras */}
      <div className="mt-7 px-2 flex-1 min-h-0 flex flex-col">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[13px] text-ink-400">Cameras</span>
            <button onClick={onAddCamera} className="text-ink-400 hover:text-ink-200" title="Add camera">
              <Icon name="plus" size={13} />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
          {cameras.map(c => (
            <CameraRow key={c.id} cam={c}
              isActive={c.id === activeCameraId}
              collapsed={collapsed}
              onSelect={onSelectCamera}
              onRename={onRenameCamera}
              onRemove={onRemoveCamera} />
          ))}
          {cameras.length === 0 && !collapsed && (
            <button onClick={onAddCamera}
                    className="w-full text-left px-2 py-2 text-[12px] text-ink-500 hover:text-ink-300">
              No cameras yet. Click + to add one.
            </button>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className={'p-2 hairline-t ' + (collapsed ? 'flex justify-center' : '')}>
        <button className={'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-ink-800 ' + (collapsed ? 'justify-center w-auto' : '')}>
          <div className="w-6 h-6 rounded-full bg-ink-700 flex items-center justify-center text-[11px] text-ink-200 shrink-0">
            {initials || '·'}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left">
              <div className="text-[13.5px] text-ink-200">{profile.name}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
