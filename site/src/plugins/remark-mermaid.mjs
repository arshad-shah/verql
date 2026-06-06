/**
 * remark-mermaid — turn ```mermaid fenced code blocks into a
 * `<pre class="mermaid">` element that the client-side renderer (mounted by
 * the Footer override) hands to Mermaid.
 *
 * We render on the client rather than at build time on purpose: build-time
 * rendering (rehype-mermaid) pulls Playwright/Chromium into the toolchain,
 * which we keep out of the dependency tree. The trade-off is a small JS
 * payload on pages that actually contain diagrams.
 *
 * The diagram source is HTML-escaped so class diagrams (`<|--`), entity
 * relations, and `<br>` labels survive being embedded as raw HTML. Mermaid
 * reads `textContent`, which the browser un-escapes back to the original.
 */

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** @returns {import('unified').Plugin} */
export default function remarkMermaid() {
  return (tree) => {
    walk(tree)
  }

  /** @param {{ children?: any[] }} node */
  function walk(node) {
    if (!node.children) return
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (child.type === 'code' && child.lang === 'mermaid') {
        node.children[i] = {
          type: 'html',
          value: `<pre class="mermaid not-content">${escapeHtml(child.value)}</pre>`,
        }
      } else {
        walk(child)
      }
    }
  }
}
