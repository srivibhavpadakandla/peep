"use client";

import type { ComponentType } from "react";
import { icons } from "lucide-react";
import { Mono, SectionLabel, StatusDot } from "./primitives";

export type ViewId = "live" | "agents" | "inbox" | "alerts" | "logs" | "usage" | "settings";

type LucideLike = ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;

interface NavItem {
  id: ViewId;
  label: string;
  Icon: LucideLike;
}

const NAV: NavItem[] = [
  { id: "live", label: "Live", Icon: icons.Video as LucideLike },
  { id: "agents", label: "Agents", Icon: icons.BrainCircuit as LucideLike },
  { id: "inbox", label: "Inbox", Icon: icons.Package as LucideLike },
  { id: "alerts", label: "Alerts", Icon: icons.ShieldAlert as LucideLike },
  { id: "logs", label: "Logs", Icon: icons.ScrollText as LucideLike },
  { id: "usage", label: "Usage", Icon: icons.Gauge as LucideLike },
  { id: "settings", label: "Settings", Icon: icons.Settings as LucideLike },
];

interface BadgeCount {
  count: number;
  kind?: "alert";
}

interface Props {
  active: ViewId;
  onChange: (next: ViewId) => void;
  collapsed: boolean;
  badgeCounts?: Partial<Record<ViewId, BadgeCount>>;
  pendingDeliveries?: number;
}

const CameraSwitcher = ({ collapsed }: { collapsed: boolean }) => {
  const cameras = [
    { id: "cam_01", label: "Front door", sub: "1080p · 12 fps", status: "live" },
    { id: "cam_02", label: "Back gate", sub: "offline", status: "off" },
    { id: "cam_03", label: "Garage", sub: "paused", status: "idle" },
  ] as const;

  return (
    <div className="mt-6 px-3 flex-1 min-h-0 flex flex-col">
      {!collapsed && (
        <div className="flex items-center justify-between px-1 mb-2">
          <SectionLabel>Cameras</SectionLabel>
          <button className="text-ink-500 hover:text-ink-200" title="Add camera">
            <icons.Plus size={12} />
          </button>
        </div>
      )}
      <div className={"flex-1 min-h-0 overflow-y-auto scroll-thin space-y-0.5 " + (collapsed ? "mt-2" : "")}>
        {cameras.map((c, i) => {
          const dot = c.status === "live" ? "#10b981" : c.status === "idle" ? "#737370" : "#525250";
          const isActive = i === 0;
          return (
            <button
              key={c.id}
              className={
                "w-full text-left rounded-md transition-colors flex items-center " +
                (collapsed ? "justify-center h-8 px-0" : "gap-2.5 px-2 py-2 ") +
                (isActive ? "bg-ink-850" : "hover:bg-ink-850")
              }
              title={collapsed ? c.label : undefined}
            >
              <StatusDot color={dot} pulse={c.status === "live"} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink-100 truncate">{c.label}</div>
                  <Mono className="text-[10.5px] text-ink-500">{c.sub}</Mono>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function Sidebar({ active, onChange, collapsed, badgeCounts = {}, pendingDeliveries = 0 }: Props) {
  return (
    <aside className={"h-full bg-ink-900 flex flex-col hairline-r " + (collapsed ? "w-[64px]" : "w-[220px]")}>
      {/* Brand */}
      <div className={"px-4 pt-5 pb-6 flex items-center " + (collapsed ? "justify-center px-0" : "gap-2.5")}>
        <div
          className="relative w-7 h-7 rounded-md bg-em flex items-center justify-center shrink-0"
          style={{ boxShadow: "0 0 0 1px rgba(16,185,129,0.45), 0 6px 18px -6px rgba(16,185,129,0.5)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.5" fill="#0a0a0a" />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-semibold tracking-tight text-ink-100">Peep</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-ink-400">camera_01</span>
          </div>
        )}
      </div>

      {/* Watching status */}
      {!collapsed && (
        <div className="mx-3 mb-4 px-3 py-2.5 rounded-lg bg-ink-850 hairline">
          <div className="flex items-center gap-2">
            <StatusDot color="#10b981" pulse />
            <span className="text-[12px] text-ink-100 font-medium">Watching</span>
          </div>
          <div className="text-[11px] text-ink-400 mt-1 leading-snug">
            All quiet. {pendingDeliveries
              ? `${pendingDeliveries} ${pendingDeliveries === 1 ? "delivery" : "deliveries"} expected.`
              : "Nothing expected today."}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="px-2">
        {NAV.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const badge = badgeCounts[id];
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={
                "group w-full h-9 px-2 my-0.5 rounded-md flex items-center gap-2.5 transition-colors relative " +
                (isActive ? "bg-ink-800 text-ink-100" : "text-ink-300 hover:bg-ink-850 hover:text-ink-100") +
                (collapsed ? " justify-center" : "")
              }
              title={collapsed ? label : undefined}
            >
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-em" />}
              <Icon
                size={15}
                className={isActive ? "text-em" : "text-ink-400 group-hover:text-ink-200"}
                strokeWidth={1.75}
              />
              {!collapsed && (
                <>
                  <span className="text-[13px] font-medium flex-1 text-left">{label}</span>
                  {badge && badge.count > 0 && (
                    <span
                      className={
                        "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono flex items-center justify-center " +
                        (badge.kind === "alert" ? "bg-red-500/15 text-red-400" : "bg-ink-700 text-ink-200")
                      }
                    >
                      {badge.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Camera switcher fills the dead space */}
      <CameraSwitcher collapsed={collapsed} />

      {/* Profile */}
      <div className={"p-3 hairline-t " + (collapsed ? "flex justify-center" : "")}>
        <button
          className={"w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-ink-850 " + (collapsed ? "justify-center w-auto" : "")}
        >
          <div className="w-7 h-7 rounded-full bg-ink-700 flex items-center justify-center text-[11px] font-mono text-ink-100 hairline shrink-0">
            JM
          </div>
          {!collapsed && (
            <div className="flex-1 text-left leading-tight">
              <div className="text-[12px] text-ink-100 font-medium">Jamie M.</div>
              <div className="text-[11px] text-ink-400 truncate">jamie@hello.com</div>
            </div>
          )}
          {!collapsed && <icons.ChevronsUpDown size={13} className="text-ink-400" />}
        </button>
      </div>
    </aside>
  );
}
