/* Peep — Inbox screen with carrier glyphs, ETA, add-package form */

function CarrierGlyph({ carrier }) {
  const colors = {
    Amazon: '#FF9900',
    UPS:    '#7B5E3C',
    FedEx:  '#bf7af0',
    USPS:   '#0a84ff',
    Other:  peep.textSec,
  };
  const c = colors[carrier] || colors.Other;
  const letter = (carrier || '?')[0];
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, background: c + '33',
      border: `0.5px solid ${c}66`, color: c,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>{letter}</div>
  );
}

function DeliveryCard({ d, onToggle }) {
  const c = d.received ? peep.accent : peep.delivery;
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <CarrierGlyph carrier={d.carrier} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{d.item}</div>
          <div style={{
            fontSize: 11, color: peep.textSec, marginTop: 2,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{d.order}</div>
        </div>
      </div>
      {d.eta && !d.received && (
        <div style={{ fontSize: 12, color: peep.delivery, fontWeight: 500 }}>
          {d.eta}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Press onTap={onToggle} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 999,
          background: c + '26', border: `0.5px solid ${c}66`, color: c,
          fontSize: 12, fontWeight: 600,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
          {d.received ? 'Received' : 'Pending'}
        </Press>
      </div>
    </Card>
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
      eta: 'Arriving today · ETA 6 PM',
      received: false,
    });
    setOrder(''); setItem(''); setCarrier('Amazon');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Expecting a package" height="80%">
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Carrier">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {carriers.map(c => (
              <Press key={c} onTap={() => setCarrier(c)} style={{
                padding: '7px 12px', borderRadius: 999,
                background: c === carrier ? peep.accent : peep.surface2,
                color: c === carrier ? '#000' : peep.text,
                fontSize: 13, fontWeight: 600,
              }}>{c}</Press>
            ))}
          </div>
        </Field>

        <Field label="Item">
          <input
            value={item} onChange={e => setItem(e.target.value)}
            placeholder="e.g. Lego Death Star"
            style={inputStyle}
          />
        </Field>

        <Field label="Order ID (optional)">
          <input
            value={order} onChange={e => setOrder(e.target.value)}
            placeholder="114-XXXXXXX-XXXXXXX"
            style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          />
        </Field>

        <Press onTap={submit} style={{
          background: item.trim() ? peep.accent : peep.surface3,
          color: item.trim() ? '#000' : peep.textSec,
          borderRadius: 14, padding: '14px 16px',
          fontWeight: 600, fontSize: 15, textAlign: 'center',
          marginTop: 8,
        }}>Watch for this package</Press>
      </div>
    </Sheet>
  );
}

const inputStyle = {
  background: peep.surface2, color: peep.text,
  border: 'none', outline: 'none', borderRadius: 10,
  padding: '12px 14px', fontSize: 15, width: '100%',
  fontFamily: '-apple-system, "SF Pro", system-ui',
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
        letterSpacing: 0.5, fontWeight: 600,
      }}>{label}</span>
      {children}
    </div>
  );
}

function InboxScreen({ state, setState, onReceived }) {
  const [adding, setAdding] = React.useState(false);
  const toast = useToast();

  const toggle = (d) => {
    const wasReceived = d.received;
    setState(s => ({
      ...s,
      deliveries: s.deliveries.map(x => x.id === d.id ? { ...x, received: !x.received } : x),
    }));
    if (!wasReceived) {
      toast(`${d.item} marked received.`, { icon: '📦' });
      onReceived && onReceived(d.order);
    }
  };

  const addDelivery = (newD) => {
    setState(s => ({ ...s, deliveries: [...s.deliveries, newD] }));
    toast(`Watching for ${newD.item}.`, { icon: '👀' });
  };

  const right = (
    <Press onTap={() => setAdding(true)} style={{
      padding: 6,
      color: peep.accent, fontSize: 24, lineHeight: 1, fontWeight: 300,
    }}>+</Press>
  );

  return (
    <>
      <Screen title="Inbox" rightAction={right} backTitle={null}>
        {state.deliveries.length === 0 ? (
          <div style={{
            padding: 40, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, marginTop: 80,
          }}>
            <div style={{ fontSize: 48, color: peep.textTer }}>▤</div>
            <div style={{ fontSize: 15, color: peep.textSec, textAlign: 'center' }}>
              No deliveries today.<br />Peep is still watching.
            </div>
            <Press onTap={() => setAdding(true)} style={{
              marginTop: 8,
              background: peep.accent, color: '#000', padding: '10px 18px',
              borderRadius: 12, fontWeight: 600, fontSize: 14,
            }}>+ Expecting a package</Press>
          </div>
        ) : (
          <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {state.deliveries.map(d => <DeliveryCard key={d.id} d={d} onToggle={() => toggle(d)} />)}
          </div>
        )}
      </Screen>
      <AddDeliverySheet open={adding} onClose={() => setAdding(false)} onAdd={addDelivery} />
    </>
  );
}

// Right-action trick: Screen ignores rightAction if backTitle is absent.
// To still render the + button, we wrap Screen with our own header overlay.
// Easier: just put the + as an absolute on the Inbox screen.

// Re-write InboxScreen to put the + button inline with the title bar.
function InboxScreenV2({ state, setState, onReceived }) {
  const [adding, setAdding] = React.useState(false);
  const toast = useToast();

  const toggle = (d) => {
    const wasReceived = d.received;
    setState(s => ({
      ...s,
      deliveries: s.deliveries.map(x => x.id === d.id ? { ...x, received: !x.received } : x),
    }));
    if (!wasReceived) {
      toast(`${d.item} marked received.`, { icon: '📦' });
      onReceived && onReceived(d.order);
    }
  };

  const addDelivery = (newD) => {
    setState(s => ({ ...s, deliveries: [...s.deliveries, newD] }));
    toast(`Watching for ${newD.item}.`, { icon: '👀' });
  };

  return (
    <Screen title="Inbox">
      {/* + button overlaid in nav area */}
      <Press onTap={() => setAdding(true)} style={{
        position: 'absolute', top: 60, right: 20, zIndex: 20,
        width: 32, height: 32, borderRadius: 999,
        background: peep.surface2, color: peep.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, lineHeight: 1, fontWeight: 300,
      }}>+</Press>

      {state.deliveries.length === 0 ? (
        <div style={{
          padding: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 16, marginTop: 80,
        }}>
          <div style={{ fontSize: 48, color: peep.textTer }}>▤</div>
          <div style={{ fontSize: 15, color: peep.textSec, textAlign: 'center' }}>
            No deliveries today.<br />Peep is still watching.
          </div>
          <Press onTap={() => setAdding(true)} style={{
            marginTop: 8,
            background: peep.accent, color: '#000', padding: '10px 18px',
            borderRadius: 12, fontWeight: 600, fontSize: 14,
          }}>+ Expecting a package</Press>
        </div>
      ) : (
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.deliveries.map(d => <DeliveryCard key={d.id} d={d} onToggle={() => toggle(d)} />)}

          {/* Helper footer */}
          <div style={{
            marginTop: 8, padding: 16, borderRadius: 14,
            background: peep.surface, border: `0.5px dashed ${peep.sep}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 26, opacity: 0.8 }}>📦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                Expecting another package?
              </div>
              <div style={{ fontSize: 12, color: peep.textSec, lineHeight: 1.4 }}>
                Add it and Peep will watch your stoop until it arrives.
              </div>
            </div>
            <Press onTap={() => setAdding(true)} style={{
              padding: '7px 12px', borderRadius: 10,
              background: peep.accent, color: '#000',
              fontSize: 13, fontWeight: 600,
            }}>+ Add</Press>
          </div>

          {/* Gmail nudge if not connected */}
          {!state.settings.integrations.Gmail && (
            <div style={{
              padding: 14, borderRadius: 14,
              background: peep.surface, border: `0.5px solid ${peep.sep}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: peep.blue + '26', color: peep.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
              }}>✉</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Connect Gmail</div>
                <div style={{ fontSize: 11, color: peep.textSec, marginTop: 2, lineHeight: 1.4 }}>
                  Peep can read shipping confirmations and add deliveries automatically.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AddDeliverySheet open={adding} onClose={() => setAdding(false)} onAdd={addDelivery} />
    </Screen>
  );
}

Object.assign(window, {
  CarrierGlyph, DeliveryCard, AddDeliverySheet, Field,
  InboxScreen: InboxScreenV2,
});
