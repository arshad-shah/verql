---
'verql': patch
---

The Plugins settings page now lists each plugin's actual contributions (drivers, commands, panels, themes, exporters, importers, middleware) as inline chips below the description. Previously, plugins that contributed only exporters or importers — like Core Formats — appeared blank because the plugin host's contribution-verification loop didn't track those kinds, so nothing flowed through to the UI. The verification path now covers exporters and importers, and the settings page renders the full contribution list.
