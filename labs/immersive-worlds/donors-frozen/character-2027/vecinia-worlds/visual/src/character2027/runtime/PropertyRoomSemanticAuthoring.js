// S3-B2B — PROPERTY ROOM SEMANTIC AUTHORING
//
// This is a derived view over the canonical WorldStore, never a second store.
// Legacy hotspots/anchors are quarry knowledge, not locomotion rails.
//
// Policy:
// - INFO hotspot + entity => KEEP as information and expose an optional viewpoint.
// - visitor-* anchor      => preferred human viewpoint candidate.
// - guide-* anchor        => secondary staging/approach hint.
// - portal/navigation     => semantic portal hint only; never a Character rail.
// - Character movement remains owned by CharacterActionAPI/MotionController.
// - Room collision remains owned by the Room/Explore solver.

function stemFromEntityId(id = '') {
  const tail = String(id).split('.').pop() || '';
  return tail.split('-').filter(Boolean)[0] || tail;
}

function displayLabel(record) {
  return record?.accessibility?.label
    || record?.title
    || record?.label
    || record?.name
    || record?.id
    || 'Semantic target';
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function anchorCandidatesForEntity(store, spaceId, entity) {
  const anchors = store.anchorsOf(spaceId);
  const stem = stemFromEntityId(entity.id);
  const matchStem = (anchor) => anchor.id.includes(`-${stem}`) || anchor.id.endsWith(stem);

  const visitor = anchors.filter((a) => a.id.includes('.visitor-') && matchStem(a));
  const guide = anchors.filter((a) => a.id.includes('.guide-') && matchStem(a));
  const authoredEntityAnchor = entity.anchorId && store.has(entity.anchorId) ? [store.get(entity.anchorId)] : [];

  return uniq([
    ...visitor.map((a) => a.id),
    ...guide.map((a) => a.id),
    ...authoredEntityAnchor.map((a) => a.id),
  ]);
}

function isPortalLike(hotspot) {
  if (!hotspot) return false;
  if (String(hotspot.id).includes('.to-')) return true;
  const type = String(hotspot.type || '').toUpperCase();
  if (type.includes('PORTAL') || type.includes('NAV')) return true;
  const target = hotspot.target || hotspot.action?.target || hotspot.action?.portalId;
  return typeof target === 'string' && target.startsWith('portal.');
}

export function createPropertyRoomSemanticAuthoring(runtime) {
  if (!runtime?.store) throw new Error('S3-B2B requires canonical runtime.store');
  const store = runtime.store;
  const spaceId = runtime.state?.activeSpaceId;
  if (!spaceId || !store.has(spaceId)) throw new Error(`S3-B2B invalid active space: ${spaceId}`);

  const entities = store.entitiesOf(spaceId);
  const anchors = store.anchorsOf(spaceId);
  const hotspots = store.hotspotsOf(spaceId);

  const viewpoints = [];
  const portalHints = [];
  const classifications = [];

  for (const hotspot of hotspots) {
    if (isPortalLike(hotspot)) {
      const record = {
        id: hotspot.id,
        classification: 'REPURPOSE_AS_PORTAL_HINT',
        reason: 'Navigation knowledge remains useful, but must not become a Character movement rail.',
      };
      portalHints.push(record);
      classifications.push(record);
      continue;
    }

    const entityId = hotspot.entityId;
    const entity = entityId && store.has(entityId) ? store.get(entityId) : null;
    const infoLike = String(hotspot.type || '').toUpperCase() === 'INFO' || Boolean(entity);
    if (!infoLike || !entity) {
      classifications.push({
        id: hotspot.id,
        classification: 'REVIEW',
        reason: 'No canonical subject relation strong enough to promote automatically.',
      });
      continue;
    }

    const anchorCandidates = anchorCandidatesForEntity(store, spaceId, entity);
    const destination = {
      id: `view:${entity.id}`,
      label: `Ver · ${displayLabel(entity)}`,
      role: 'PREFERRED_VIEWPOINT',
      spaceId,
      subjectRef: entity.id,
      hotspotRef: hotspot.id,
      anchorCandidates,
      provenance: {
        hotspot: hotspot.id,
        entity: entity.id,
        visitorHints: anchorCandidates.filter((id) => id.includes('.visitor-')),
        guideHints: anchorCandidates.filter((id) => id.includes('.guide-')),
      },
    };
    viewpoints.push(destination);
    classifications.push({
      id: hotspot.id,
      classification: 'KEEP_AS_INFO_REPURPOSE_FOR_VIEWPOINT',
      subjectRef: entity.id,
      anchorCandidates,
      reason: 'Information remains useful; legacy human anchors become optional viewpoint/staging hints.',
    });
  }

  const orphanGuideAnchors = anchors
    .filter((a) => a.id.includes('.guide-'))
    .filter((a) => !viewpoints.some((v) => v.anchorCandidates.includes(a.id)))
    .map((a) => ({ id: a.id, classification: 'REVIEW_AS_APPROACH_HINT' }));

  const orphanVisitorAnchors = anchors
    .filter((a) => a.id.includes('.visitor-'))
    .filter((a) => !viewpoints.some((v) => v.anchorCandidates.includes(a.id)))
    .map((a) => ({ id: a.id, classification: 'REVIEW_AS_VIEWPOINT_HINT' }));

  function resolve(id, contract) {
    const entry = viewpoints.find((x) => x.id === id);
    if (!entry) return { ok: false, reason: 'UNKNOWN_SEMANTIC_DESTINATION', id };
    if (!contract) return { ok: false, reason: 'NO_HUMAN_SPATIAL_CONTRACT', id };

    const attempts = [];
    for (const anchorId of entry.anchorCandidates) {
      if (!store.has(anchorId)) continue;
      try {
        const target = contract.resolve({ anchorId, subjectRef: entry.subjectRef });
        const validation = contract.validatePoint(target.position);
        attempts.push({ anchorId, safe: Boolean(validation.safe), inside: Boolean(validation.inside) });
        if (validation.safe || validation.inside) {
          return {
            ok: true,
            entry,
            anchorId,
            target,
            validation,
            attempts,
          };
        }
      } catch (error) {
        attempts.push({ anchorId, safe: false, error: error.message });
      }
    }
    return { ok: false, reason: 'NO_USABLE_VIEWPOINT', entry, attempts };
  }

  function audit() {
    return {
      source: 'CANONICAL_WORLD_STORE_DERIVED_VIEW',
      spaceId,
      worldRevision: store.revision,
      canonicalIdentity: store.auditCanonicalIdentity(),
      entities: entities.length,
      anchors: anchors.length,
      hotspots: hotspots.length,
      viewpoints: viewpoints.map((v) => ({
        id: v.id,
        subjectRef: v.subjectRef,
        hotspotRef: v.hotspotRef,
        anchorCandidates: [...v.anchorCandidates],
      })),
      portalHints: [...portalHints],
      orphanGuideAnchors,
      orphanVisitorAnchors,
      classifications: [...classifications],
    };
  }

  return Object.freeze({
    spaceId,
    destinations: viewpoints,
    viewpoints,
    portalHints,
    classifications,
    orphanGuideAnchors,
    orphanVisitorAnchors,
    resolve,
    audit,
  });
}
