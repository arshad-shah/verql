---
"verql": patch
---

Continue the incremental Cynosure migration: rebuild the boot `SplashScreen`
on Cynosure primitives and drop its Tailwind. The loader and status text are
now Cynosure's `<Spinner>` and `<Text>`, wrapped in `<Center>` + `<Stack>`
styled by props, so colours flow through the `--cynosure-*` bridge and the
active theme recolours it with no Tailwind classes. No visual or behavioural
change.
