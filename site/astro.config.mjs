// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import remarkMermaid from './src/plugins/remark-mermaid.mjs'

const GITHUB = 'https://github.com/arshad-shah/verql'

// https://astro.build/config
export default defineConfig({
  site: 'https://verql.arshadshah.com',
  markdown: {
    // Turn ```mermaid fenced blocks into client-rendered diagrams (see
    // src/plugins/remark-mermaid.mjs + the Footer override that runs mermaid).
    remarkPlugins: [remarkMermaid],
  },
  integrations: [
    starlight({
      title: 'Verql',
      description:
        'A fast, extensible desktop database client. Developer and user documentation for the app, its plugin SDK, and contribution surfaces.',
      logo: {
        light: './src/assets/verql-logo-light.svg',
        dark: './src/assets/verql-logo-dark.svg',
        alt: 'Verql',
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/theme.css'],
      social: [{ icon: 'github', label: 'GitHub', href: GITHUB }],
      editLink: { baseUrl: `${GITHUB}/edit/main/site/` },
      lastUpdated: true,
      components: {
        // Override the Footer to mount the client-side Mermaid renderer on
        // every docs page (it re-renders on theme toggle + navigation).
        Footer: './src/components/Footer.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://verql.arshadshah.com/favicon.svg' },
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#0e121b' },
        },
      ],
      sidebar: [
        {
          label: 'User Guide',
          items: [{ autogenerate: { directory: 'guide' } }],
        },
        {
          label: 'Architecture',
          items: [{ autogenerate: { directory: 'develop' } }],
        },
        {
          label: 'Plugins & SDK',
          items: [{ autogenerate: { directory: 'plugins' } }],
        },
      ],
    }),
  ],
})
