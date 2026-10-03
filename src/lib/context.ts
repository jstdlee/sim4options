import { onBeforeUnmount, watchEffect } from 'vue'
import { useApp, type ScreenContext } from '../stores/app'

/**
 * Tell Kon (the tutor) what is on screen. The chat attaches the latest value to every message,
 * so learners never have to paste the question in. Pass `null` when there is nothing useful.
 */
export function usePageContext(read: () => ScreenContext | null) {
  const app = useApp()
  let mine: ScreenContext | null = null
  watchEffect(() => { mine = read(); app.pageContext = mine })
  onBeforeUnmount(() => { if (app.pageContext === mine) app.pageContext = null })
}
