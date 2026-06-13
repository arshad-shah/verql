---
'verql': patch
---

Fix the Microsoft Store publish job. `msstore publish`'s first argument is the
project (it reads `package.json` to identify the Electron app), not a package
file — pointing it at the bare `.appx` failed with "could not find a project
publisher". The `publish-msstore` job now checks out the tagged source and runs
`msstore publish . -id "$PRODUCT_ID" --inputFile <appx>`, submitting the
prebuilt package instead of trying to rebuild. The GitHub release (macOS DMGs,
Linux AppImage, signed checksums, SBOM) was unaffected and already publishing.
