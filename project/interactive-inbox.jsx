/* Peep — Inbox screen with carrier glyphs, ETA, add-package form */

function CarrierGlyph() { return null; }

function DeliveryCard({ d, onToggle, onOpen }) {
  return (
    <Press onTap={onOpen} style={{
      background: peep.surface, borderRadius: 12, padding: 14,
      border: `0.5px solid ${peep.sep}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: peep.text }}>
        {d.item}
      </div>
      <div style={{ fontSize: 13, color: peep.textSec }}>
        {d.carrier} · {d.order}
      </div>
      {d.eta && !d.received && (
        <div style={{ fontSize: 13, color: peep.text }}>{d.eta}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <Press onTap={(e) => { e && e.stopPropagation && e.stopPropagation(); onToggle(); }} style={{
          padding: '6px 10px', borderRadius: 8,
          background: d.received ? peep.text : 'transparent',
          color: d.received ? peep.bg : peep.text,
          fontSize: 13, fontWeight: 400,
          border: d.received ? 'none' : `0.5px solid ${peep.sep}`,
        }}>
          {d.received ? 'Received' : 'Mark received'}
        </Press>
      </div>
    </Press>
  );
}

// ───────── Package detail sheet (tap a delivery to open) ─────────
function PackageDetailSheet({ delivery, onClose, onShareEta, onToggle }) {
  if (!delivery) return null;
  return (
    <Sheet open={!!delivery} onClose={onClose} title="Package" height="72%">
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          background: peep.surface, borderRadius: 14, padding: 16,
          border: `0.5px solid ${peep.sep}`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: peep.surface2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="package" size={22} weight="fill" color={peep.text} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: peep.text, lineHeight: 1.3 }}>
                {delivery.item}
              </div>
              <div style={{ fontSize: 13, color: peep.textSec, marginTop: 2 }}>
                {delivery.carrier} · {delivery.order}
              </div>
            </div>
          </div>
          {delivery.eta && !delivery.received && (
            <div style={{
              padding: 10, borderRadius: 10, background: peep.accentSoft,
              fontSize: 13, color: peep.text, display: 'flex',
              alignItems: 'center', gap: 8,
            }}>
              <Icon name="clock" size={16} weight="fill" color={peep.accent} />
              {delivery.eta}
            </div>
          )}
          {delivery.received && (
            <div style={{
              padding: 10, borderRadius: 10, background: peep.surface2,
              fontSize: 13, color: peep.textSec, display: 'flex',
              alignItems: 'center', gap: 8,
            }}>
              <Icon name="check-circle" size={16} weight="fill" color={peep.accent} />
              Marked received
            </div>
          )}
        </div>

        {!delivery.received && (
          <Press onTap={() => onShareEta(delivery)} style={{
            background: peep.accent, color: '#fff',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 15, fontWeight: 600, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon name="paper-plane-tilt" size={18} weight="fill" color="#fff" />
            Share ETA with a friend
          </Press>
        )}

        <Press onTap={() => { onToggle(delivery); onClose(); }} style={{
          background: peep.surface2, color: peep.text,
          borderRadius: 14, padding: '14px 16px',
          fontSize: 15, fontWeight: 500, textAlign: 'center',
          border: `0.5px solid ${peep.sep}`,
        }}>
          {delivery.received ? 'Mark as not received' : 'Mark received'}
        </Press>

        <div style={{
          padding: 12, borderRadius: 10, background: peep.bg,
          border: `0.5px dashed ${peep.sep}`,
          fontSize: 11, color: peep.textSec, lineHeight: 1.5,
        }}>
          Sharing an ETA sends a one-time link with the carrier window. Friends can mark
          the package as picked up on your behalf — they never see your live cameras.
        </div>
      </div>
    </Sheet>
  );
}

function AddDeliverySheet({ open, onClose, onAdd }) {
  const [order, setOrder] = React.useState('');
  const [item, setItem] = React.useState('');
  const [carrier, setCarrier] = React.useState('Amazon');
  const carriers = ['Amazon', 'UPS', 'FedEx', 'USPS', 'Other'];

  const submit = () => {
    if (!item.trim()) return;
    onAdd({
      id: 'd' + Math.random().toString(36).slice(2,6),
      order: order.trim() || `${carrier.toUpperCase()}-${Math.floor(Math.random()*999999)}`,
      item: item.trim(),
      carrier,
      eta: 'Arriving today by 6 PM',
      received: false,
    });
    setOrder(''); setItem(''); setCarrier('Amazon');
    onClose();
  };

  const carriers2 = carriers;

  return (
    <Sheet open={open} onClose={onClose} title="Expecting a package" height="80%">
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Carrier">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {carriers2.map(c => (
              <Press key={c} onTap={() => setCarrier(c)} style={{
                padding: '6px 12px', borderRadius: 999,
                background: c === carrier ? peep.text : 'transparent',
                color: c === carrier ? peep.bg : peep.text,
                fontSize: 13, fontWeight: 400,
                border: c === carrier ? 'none' : `0.5px solid ${peep.sep}`,
              }}>{c}</Press>
            ))}
          </div>
        </Field>

        <Field label="Item">
          <input
            value={item} onChange={e => setItem(e.target.value)}
            placeholder="Lego Death Star"
            style={inputStyle}
          />
        </Field>

        <Field label="Order ID (optional)">
          <input
            value={order} onChange={e => setOrder(e.target.value)}
            placeholder="114-XXXXXXX-XXXXXXX"
            style={inputStyle}
          />
        </Field>

        <Press onTap={submit} style={{
          marginTop: 6,
          background: item.trim() ? peep.text : peep.surface3,
          color: item.trim() ? peep.bg : peep.textSec,
          borderRadius: 10, padding: '12px 16px',
          fontWeight: 400, fontSize: 15, textAlign: 'center',
        }}>Watch for this package</Press>
      </div>
    </Sheet>
  );
}

const inputStyle = {
  background: peep.surface2, color: peep.text,
  border: `0.5px solid ${peep.sep}`, outline: 'none', borderRadius: 8,
  padding: '10px 12px', fontSize: 15, width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: peep.textSec, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

function InboxScreen({ state, setState, onReceived }) {
  const [adding, setAdding] = React.useState(false);
  const [openPkg, setOpenPkg] = React.useState(null);
  const [shareEta, setShareEta] = React.useState(null);
  const toast = useToast();

  const toggle = (d) => {
    const wasReceived = d.received;
    setState(s => ({
      ...s,
      deliveries: s.deliveries.map(x => x.id === d.id ? { ...x, received: !x.received } : x),
    }));
    if (!wasReceived) {
      toast(`${d.item} marked received.`, { icon: 'package' });
      onReceived && onReceived(d.order);
    }
  };

  const addDelivery = (newD) => {
    setState(s => ({ ...s, deliveries: [...s.deliveries, newD] }));
    toast(`Watching for ${newD.item}.`, { icon: 'eye' });
  };

  return (
    <Screen title="Inbox">
      <Press onTap={() => setAdding(true)} style={{
        position: 'absolute', top: 60, right: 16, zIndex: 20,
        padding: '4px 10px', color: peep.text,
        fontSize: 14, fontWeight: 400,
      }}>Add</Press>

      {state.deliveries.length === 0 ? (
        <div style={{
          padding: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 12, marginTop: 80,
        }}>
          <div style={{ fontSize: 15, color: peep.textSec, textAlign: 'center', lineHeight: 1.5 }}>
            No deliveries today.
          </div>
          <Press onTap={() => setAdding(true)} style={{
            background: peep.text, color: peep.bg,
            padding: '8px 14px', borderRadius: 8,
            fontSize: 14, fontWeight: 400,
          }}>Add a package</Press>
        </div>
      ) : (
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.deliveries.map(d => (
            <DeliveryCard key={d.id} d={d}
              onToggle={() => toggle(d)}
              onOpen={() => setOpenPkg(d)} />
          ))}

          {!state.settings.integrations.Gmail && (
            <Press style={{
              padding: 14, borderRadius: 12,
              background: peep.surface, border: `0.5px solid ${peep.sep}`,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: peep.text }}>Connect Gmail</div>
              <div style={{ fontSize: 13, color: peep.textSec, lineHeight: 1.4 }}>
                Peep will add deliveries from shipping confirmations.
              </div>
            </Press>
          )}
        </div>
      )}

      <AddDeliverySheet open={adding} onClose={() => setAdding(false)} onAdd={addDelivery} />
      <PackageDetailSheet
        delivery={openPkg}
        onClose={() => setOpenPkg(null)}
        onToggle={toggle}
        onShareEta={(d) => { setOpenPkg(null); setShareEta(d); }}
      />
      <ShareEtaSheet
        open={!!shareEta}
        delivery={shareEta}
        onClose={() => setShareEta(null)}
      />
    </Screen>
  );
}

Object.assign(window, {
  CarrierGlyph, DeliveryCard, AddDeliverySheet, PackageDetailSheet, Field, InboxScreen,
});
