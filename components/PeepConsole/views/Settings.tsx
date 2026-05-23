"use client";

import { Children, useState, type ReactNode } from "react";
import { icons } from "lucide-react";
import { Btn, Mono, Pill, Slider, StatusDot, Surface, Toggle } from "../primitives";

const FormRow = ({
  label,
  sub,
  children,
  align = "center",
}: {
  label: string;
  sub?: string;
  children: ReactNode;
  align?: "center" | "start";
}) => (
  <div
    className={
      "grid grid-cols-[260px_1fr] gap-8 px-6 py-5 hairline-b items-" +
      (align === "center" ? "center" : "start")
    }
  >
    <div>
      <div className="text-[13px] font-medium text-ink-100">{label}</div>
      {sub && <div className="text-[12px] text-ink-400 mt-1 leading-relaxed">{sub}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const SectionCard = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) => (
  <div className="mb-6">
    <div className="px-1 mb-3">
      <div className="text-[14px] font-semibold text-ink-100">{title}</div>
      {sub && <div className="text-[12.5px] text-ink-400 mt-0.5">{sub}</div>}
    </div>
    <Surface className="overflow-hidden">
      {Children.map(children, (c) => (
        <div>{c}</div>
      ))}
    </Surface>
  </div>
);

export default function SettingsView() {
  const [gmail, setGmail] = useState(true);
  const [dwell, setDwell] = useState(12);
  const [cooldown, setCooldown] = useState(45);
  const [movement, setMovement] = useState(8);
  const [amazon, setAmazon] = useState(true);
  const [police, setPolice] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="px-8 pt-6 pb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Settings</h1>
        <div className="text-[12.5px] text-ink-400 mt-1">Connections, detection knobs, and integrations.</div>
      </div>

      <div className="px-8 pb-10 max-w-[860px]">
        <SectionCard title="Gmail" sub="Peep parses your inbox to know what's expected at the door.">
          <FormRow label="Connection" sub="Connected as jamie@hello.com. Last refreshed 4 minutes ago." align="center">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-ink-800 hairline flex items-center justify-center">
                  <icons.Mail size={14} className="text-ink-300" />
                </div>
                <div>
                  <div className="text-[13px] text-ink-100">jamie@hello.com</div>
                  <Pill color="#10b981" className="mt-1">
                    <StatusDot color="#10b981" />
                    Connected
                  </Pill>
                </div>
              </div>
              {gmail ? (
                <Btn variant="danger" size="md" onClick={() => setShowDisconnect(true)}>
                  Disconnect
                </Btn>
              ) : (
                <Btn variant="primary" size="md" onClick={() => setGmail(true)}>
                  Connect Gmail
                </Btn>
              )}
            </div>
          </FormRow>
          <FormRow label="Permissions" sub="The minimum we need. Nothing else is read or stored." align="start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-ink-900 hairline">
                <icons.Check size={13} className="text-em" />
                <Mono className="text-[12px] text-ink-200">gmail.readonly</Mono>
                <span className="text-[11.5px] text-ink-400">
                  — read messages matching delivery senders only.
                </span>
              </div>
              <div className="text-[11.5px] text-ink-500">
                Peep never sends, deletes, or modifies messages on your behalf.
              </div>
            </div>
          </FormRow>
        </SectionCard>

        <SectionCard title="Detection" sub="How sensitive Peep is to what's happening at the door.">
          <FormRow label="Dwell threshold" sub="How long a person must stay before Peep flags loitering.">
            <Slider value={dwell} onChange={setDwell} min={3} max={120} step={1} format={(v) => `${v}s`} />
          </FormRow>
          <FormRow label="Alert cooldown" sub="Minimum gap between repeat alerts for the same person.">
            <Slider
              value={cooldown}
              onChange={setCooldown}
              min={10}
              max={600}
              step={5}
              format={(v) => (v < 60 ? `${v}s` : `${Math.floor(v / 60)} min ${v % 60}s`)}
            />
          </FormRow>
          <FormRow label="Movement threshold" sub="Pixels of frame-to-frame motion that count as 'moving'.">
            <Slider value={movement} onChange={setMovement} min={1} max={30} step={1} format={(v) => `${v} px`} />
          </FormRow>
        </SectionCard>

        <SectionCard title="Integrations" sub="Where Peep is allowed to take action on your behalf.">
          <FormRow label="Amazon" sub="Files refund claims for stolen and missing packages.">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-ink-800 hairline flex items-center justify-center">
                  <icons.Package size={14} className="text-ink-300" />
                </div>
                <div>
                  <div className="text-[13px] text-ink-100">Amazon · order history</div>
                  <Pill color={amazon ? "#10b981" : "#9a9a96"} className="mt-1">
                    <StatusDot color={amazon ? "#10b981" : "#9a9a96"} />
                    {amazon ? "Active" : "Disabled"}
                  </Pill>
                </div>
              </div>
              <Toggle on={amazon} onChange={setAmazon} />
            </div>
          </FormRow>
          <FormRow label="Local police non-emergency" sub="Off by default. Files a non-emergency report on weapon detection.">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-ink-800 hairline flex items-center justify-center">
                  <icons.Shield size={14} className="text-ink-300" />
                </div>
                <div>
                  <div className="text-[13px] text-ink-100">SFPD · non-emergency line</div>
                  <Pill color={police ? "#10b981" : "#9a9a96"} className="mt-1">
                    <StatusDot color={police ? "#10b981" : "#9a9a96"} />
                    {police ? "Active" : "Not connected"}
                  </Pill>
                </div>
              </div>
              <Toggle on={police} onChange={setPolice} />
            </div>
          </FormRow>
        </SectionCard>
      </div>

      {showDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDisconnect(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-[420px] bg-ink-900 hairline rounded-xl p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-semibold text-ink-100">Sign out of Gmail?</div>
            <div className="text-[13px] text-ink-300 mt-2 leading-relaxed">
              Peep will fall back to the seeded demo inbox. Existing alerts and logs are kept.
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Btn variant="outline" size="md" onClick={() => setShowDisconnect(false)}>
                Cancel
              </Btn>
              <Btn
                variant="danger"
                size="md"
                onClick={() => {
                  setGmail(false);
                  setShowDisconnect(false);
                }}
              >
                Sign out
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
