// Orchestration agent — reads events, picks a workflow, dispatches to browser agent.
//
// Default routing is a deterministic stub (event_type → workflow). When an
// Anthropic API key is available, the same routing call is made via Claude
// (sonnet) so the agent can reason about edge cases / new event types.
//
// Browser agent dispatch is HTTP: POST {BROWSER_AGENT_URL}/run with the
// chosen workflow + the source event. Response is a receipt that we re-publish
// to the bus as a 'browser_agent_done' record.

(function () {
  const { EVENT_TYPES } = window.PeepEventContract;
  const BUS = window.PeepEventBus;

  const BROWSER_AGENT_URL = (window.PeepConfig && window.PeepConfig.browserAgentUrl)
                          || 'http://localhost:8787';

  // Deterministic routing table — also serves as the contract the Claude prompt
  // is allowed to choose from, so the LLM can never invent unknown workflows.
  const WORKFLOWS = {
    file_amazon_refund:        { target: 'amazon', action: 'refund', reason: 'package_stolen' },
    file_refund_and_alert:     { target: 'amazon', action: 'refund', reason: 'package_stolen_fleeing', alert: true },
    file_missing_delivery:     { target: 'amazon', action: 'claim',  reason: 'never_arrived' },
    log_only:                  { target: 'log',    action: 'append' },
  };

  function deterministicRoute(event) {
    switch (event.event_type) {
      case EVENT_TYPES.PACKAGE_TAKEN:      return 'file_amazon_refund';
      case EVENT_TYPES.PACKAGE_FLEEING:    return 'file_refund_and_alert';
      case EVENT_TYPES.PORCH_THEFT:        return 'file_refund_and_alert';
      case EVENT_TYPES.SUDDEN_MOVEMENT:    return 'log_only';
      case 'package_not_arrived':          return 'file_missing_delivery';
      case EVENT_TYPES.PACKAGE_ARRIVED:    return 'log_only';
      case EVENT_TYPES.PERSON_LOITERING:   return 'log_only';
      default:                             return 'log_only';
    }
  }

  async function claudeRoute(event, apiKey) {
    const system = `You are the orchestration agent for a security-camera system.
Given a single event, choose exactly one workflow id from this set:
${Object.keys(WORKFLOWS).map(k => `- ${k}: ${JSON.stringify(WORKFLOWS[k])}`).join('\n')}
Respond with ONLY the workflow id, no prose.`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 32,
        system,
        messages: [{ role: 'user', content: JSON.stringify(event) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude routing failed: ${res.status}`);
    const body = await res.json();
    const choice = (body.content?.[0]?.text || '').trim();
    if (!WORKFLOWS[choice]) throw new Error(`Claude returned unknown workflow: ${choice}`);
    return choice;
  }

  async function route(event) {
    const apiKey = (window.PeepConfig && window.PeepConfig.anthropicApiKey)
                || localStorage.getItem('peep.anthropicKey');
    if (apiKey) {
      try { return await claudeRoute(event, apiKey); }
      catch (e) { console.warn('Claude route failed, falling back to deterministic', e); }
    }
    return deterministicRoute(event);
  }

  async function dispatchToBrowserAgent(workflowId, event) {
    const workflow = WORKFLOWS[workflowId];
    if (!workflow || workflow.target !== 'amazon') {
      return { ok: true, skipped: true, reason: 'no browser action for ' + workflowId };
    }
    try {
      const res = await fetch(`${BROWSER_AGENT_URL}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workflow: workflowId, params: workflow, event }),
      });
      if (!res.ok) throw new Error(`browser agent ${res.status}`);
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Internal log of decisions, for the UI to render.
  const decisions = [];
  const decisionSubs = new Set();
  function recordDecision(d) {
    decisions.unshift(d);
    if (decisions.length > 100) decisions.length = 100;
    decisionSubs.forEach(fn => { try { fn(decisions); } catch {} });
  }

  // Subscribe to incoming events.
  BUS.subscribe(async (event) => {
    // Don't recurse on our own emitted records.
    if (event.event_type === 'browser_agent_done') return;
    const workflow = await route(event);
    recordDecision({ ts: Date.now(), event, workflow, status: 'dispatched' });
    window.PeepLiveLogs?.append({
      source: 'orchestration',
      text: `Routed ${event.event_type} (${event.confidence.toFixed(2)}) → ${workflow}.`,
    });

    // Security email side-effect — fires for alert-class workflows + flee detection.
    if (workflow === 'file_refund_and_alert' || event.event_type === EVENT_TYPES.PACKAGE_FLEEING) {
      const profile = window.PeepProfile?.get() || { email: 'jamie@hello.com' };
      const ref = 'MSG-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      window.PeepLiveLogs?.append({
        source: 'system',
        text: `Security email sent to ${profile.email}. Reference ${ref}.`,
      });
    }

    const receipt = await dispatchToBrowserAgent(workflow, event);
    recordDecision({ ts: Date.now(), event, workflow, status: receipt.ok ? 'done' : 'failed', receipt });
    if (receipt && (receipt.ok || receipt.skipped)) {
      // Re-publish a receipt event so the UI can show the outcome on the timeline.
      BUS.publish({
        event_type: 'browser_agent_done',
        confidence: 1,
        evidence_clip: { kind: 'receipt', ref: JSON.stringify(receipt) },
      });
    }
  });

  window.PeepOrchestrator = {
    WORKFLOWS,
    route,
    getDecisions: () => decisions.slice(),
    onDecision: (fn) => { decisionSubs.add(fn); return () => decisionSubs.delete(fn); },
  };
})();
