import { ref, watchEffect, onScopeDispose } from 'vue'
import { liveQuery } from 'dexie'

/**
 * Vue 3 composable wrapping Dexie's liveQuery().
 *
 * Returns a reactive ref that auto-updates whenever:
 *  - IndexedDB data touched by the query changes (any tab)
 *  - Any Vue reactive dependency read inside `querier` changes
 *
 * @param {() => Promise<T> | T} querier  — async function performing Dexie reads
 * @param {T}                    initial  — initial value before first query resolves
 * @returns {import('vue').Ref<T>}
 */
export function useLiveQuery(querier, initial) {
  const data = ref(initial)
  let subscription

  watchEffect((onCleanup) => {
    subscription?.unsubscribe()

    const observable = liveQuery(querier)

    subscription = observable.subscribe({
      next: (value) => {
        data.value = value
      },
      error: (err) => {
        console.error('[useLiveQuery]', err)
      }
    })

    onCleanup(() => {
      subscription?.unsubscribe()
    })
  })

  onScopeDispose(() => {
    subscription?.unsubscribe()
  })

  return data
}
