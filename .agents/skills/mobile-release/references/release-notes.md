# Store release notes

Every store gets the same fixed text, "Bug fixes and improvements.", translated into each listing language. Never derive it from the changelog and never add details; the changelog only goes to the GitHub release.

| Language                | Text                                  | App Store | Google Play  | Microsoft Store |
| ----------------------- | ------------------------------------- | --------- | ------------ | --------------- |
| English                 | Bug fixes and improvements.           | en-US     | en-US        | en-us           |
| Simplified Chinese      | 错误修复和改进。                      | zh-Hans   | zh-CN        | zh-cn           |
| Traditional Chinese     | 錯誤修正與改進。                      | zh-Hant   | zh-TW, zh-HK | zh-tw, zh-hk    |
| Japanese                | 不具合の修正と改善。                  | ja        | ja-JP        | ja              |
| French                  | Corrections de bugs et améliorations. | fr-FR     | fr-FR        | fr-fr           |
| German                  | Fehlerbehebungen und Verbesserungen.  | de-DE     | de-DE        | de-de           |
| Spanish (Spain)         | Corrección de errores y mejoras.      | es-ES     | es-ES        | es-es           |
| Spanish (Latin America) | Corrección de errores y mejoras.      | es-MX     | es-419       | es-mx           |
| Portuguese (Brazil)     | Correções de bugs e melhorias.        | pt-BR     | pt-BR        | pt-br           |
| Korean                  | 버그 수정 및 개선.                    | ko        | ko-KR        | ko-kr           |
| Italian                 | Correzioni di bug e miglioramenti.    | it        | it-IT        | it-it           |
| Russian                 | Исправления ошибок и улучшения.       | ru        | ru-RU        | ru-ru           |

- App Store Connect requires What's New for every locale of an update. Read the live list with `asc localizations list --version <version id>`; a locale missing from this table gets the English text.
- Google Play takes all languages in one field, one block per language:
  ```
  <en-US>
  Bug fixes and improvements.
  </en-US>
  <zh-CN>
  错误修复和改进。
  </zh-CN>
  ```
- Microsoft Store has a "What's new in this version" field in every listing language.

Until October 2026 the stores carried only en-US "Bug fixes and improvements."; the other listing languages were added then.
