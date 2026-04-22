# quick lens

> **Status: DEFERRED** · W199-L5-L02 · 2026-04-22
>
> Prototype at `../../../prototypes/quick.jsx` (1,801 LOC) is not
> ready to publish. Lens artifact scaffolding (`lens.toml`, `plugin.toml`,
> `ui/`) is in place; integration with desktop is deferred until
> activation conditions below are met.

## Purpose

- advertise the `quick` launch identity (`lens:quick`)
- describe quick handoff capabilities and runtime workflow
- keep Quick surface evolution additive while backend contract stays stable

## Why deferred

Three gating reasons — each must resolve before `quick` can flip from
DEFERRED to ACTIVE:

1. **Prototype not ready for publish.** Per operator signal in W199 iter 20
   research wave 0: "I have quick @prototypes/quick.jsx for it but it's not
   ready to publish yet". The prototype needs UX review + hardening before
   the lens goes live.

2. **Lens v2 wiring in desktop incomplete.** Desktop's Lens integration
   layer is in flight (`lens-store.tile` registry surface exists per L3-L01
   / L2-L06; full launch contract at W199-L5-L05 scope). Quick needs the
   launch contract stable before install/activate round-trips work.

3. **No QR pairing** (operator memory rule: "No QR codes — use discovery").
   The original Quick flow used QR-based device pairing; the discovery-based
   replacement (Bonjour/BLE) is not yet landed. Shipping Quick without a
   discovery path would surface stale QR UX; shipping with a placeholder
   would violate the memory rule.

## Activation conditions

Flip `DEFERRED` → `ACTIVE` when all three:

- [ ] Prototype `prototypes/quick.jsx` reviewed + hardened (operator sign-off)
- [ ] Lens v2 wiring stable in desktop (`lens:quick` launch contract lands
      + tested via `useLensLaunchQuery` from W197-L4)
- [ ] Discovery-based pairing (Bonjour/BLE) lands in desktop (replaces
      QR flow per operator memory)

When activated, update this doc's status banner + remove the DEFERRED
prefix from `lens.toml` version description.

## What exists already (scaffolding)

- `lens.toml` — launch identity + surface + capabilities + shortcuts declared
- `plugin.toml` — plugin manifest
- `ui/` — lens UI entry (scaffolding; not yet wired)

## What lives in the desktop side (W199 context)

- **Register** the lens launch contract via `useLensLaunchQuery(lensId)`
  (W197-L4 infrastructure) — `lens:quick` as launch ID
- **Marketplace tile** rendering via `lens-store.tile` registry surface
  (L3-L01 + L2-L06 wiring)
- **Lens install flow** in `LensStorePane` (W199-L5-L05 scope)

## Intentional non-goals while deferred

- Do NOT land a placeholder tray UI in desktop that "calls into Quick" —
  keeps the surface visibly empty rather than demo-ware
- Do NOT add a QR-based pairing hook — memory rule compliance
- Do NOT publish to the Lens marketplace until all three activation
  conditions are met

## Reference

- Prototype: `../../../prototypes/quick.jsx` (1,801 LOC)
- W199 decision: `../../../docs/loops/w199-5x-ralph-full-prototype-parity/L5-orchestration-marketplace-cleanup/loop-02-quick-deferral-doc.md`
- Operator memory: `Quick is a lens, not a package` · `No QR codes — use discovery`
