/**
 * Catalog state: one place that knows the roots, the caches and the
 * invalidation rules for the two read-only catalogs (experts, skills).
 *
 * Caching is TTL + explicit invalidation: a scan touches every file under a
 * root, so a panel refresh should not re-walk the disk; a mutation calls
 * invalidate*() and the next read rescans.
 */

import { scanExperts } from './experts.js'
import { scanSkills } from './skills.js'

const TTL_MS = 15000

function now() {
  return Date.now()
}

/**
 * @param {{dshHome: string, agentsHome: string, workbuddyHome: string, projectRoot: string}} options
 */
export function createState(options) {
  const state = {
    dshHome: options.dshHome,
    agentsHome: options.agentsHome,
    workbuddyHome: options.workbuddyHome,
    projectRoot: options.projectRoot,
    expertCache: undefined,
    skillCache: undefined,
    invalidateExperts() {
      state.expertCache = undefined
    },
    invalidateSkills() {
      state.skillCache = undefined
    },
    invalidateAll() {
      state.invalidateExperts()
      state.invalidateSkills()
    },
    async expertsCatalog() {
      if (state.expertCache !== undefined && state.expertCache.expires > now()) return state.expertCache.value
      const value = await scanExperts({
        dshHome: state.dshHome,
        workbuddyHome: state.workbuddyHome,
        projectRoot: state.projectRoot,
      })
      state.expertCache = { value, expires: now() + TTL_MS }
      return value
    },
    async skillsCatalog() {
      if (state.skillCache !== undefined && state.skillCache.expires > now()) return state.skillCache.value
      const value = await scanSkills({
        dshHome: state.dshHome,
        agentsHome: state.agentsHome,
        workbuddyHome: state.workbuddyHome,
        projectRoot: state.projectRoot,
      })
      state.skillCache = { value, expires: now() + TTL_MS }
      return value
    },
    /** Everything the panel needs in one round trip. */
    async snapshot() {
      const [experts, skills, connectorState] = await Promise.all([
        state.expertsCatalog(),
        state.skillsCatalog(),
        options.connectors(),
      ])
      return {
        version: 1,
        roots: {
          dshHome: state.dshHome,
          agentsHome: state.agentsHome,
          workbuddyHome: state.workbuddyHome,
          projectRoot: state.projectRoot,
        },
        experts: experts.experts,
        expertWarnings: experts.warnings,
        expertRoots: experts.roots,
        skills: skills.skills,
        skillWarnings: skills.warnings,
        skillRoots: skills.roots,
        connectors: connectorState.connectors,
        connectorSeeds: connectorState.seeds,
        scannedAt: new Date().toISOString(),
      }
    },
  }
  return state
}
