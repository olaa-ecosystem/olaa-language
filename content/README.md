# Lesson content

Data only. The app reads these files; nothing here runs.

| Path | What | Used in the app |
|---|---|---|
| `english/`, `spanish/`, `chinese/` `levels/*.json` | Units per level: theory, tables, vocabulary, reading passages and questions. English and Spanish A1–C2, Chinese HSK1–HSK6. | Yes: **Lộ trình** (levels, units, level tests). Each level is its own download chunk. |
| `*/meta.json` | Language name and the level list (code, name, exam, word count). | Yes |
| `chinese/hanviet.json` | Sino-Vietnamese (Hán Việt) reading per character. | Yes: shown under characters and Chinese words. |
| `*/glossary.json`, `*/pronunciation.json` | Glossary (6–8k entries) and pronunciation notes. | Not yet. Imported so nothing from the source is lost. |
| `manifest.json` | Counts per language and level, from the source export. | By the content test only. |
| `topics/topics.json` | The 15 themed topics (vocabulary, sentences, grammar, pronunciation, tasks, exercises) for the three languages. | Yes: **Chủ đề**. |

## Where it came from

- Levels, meta, glossary, pronunciation, Hán Việt and manifest: the owner's export `AtoZ-du-lieu-bai-hoc.zip` (manifest `source: index.html`, extracted 2026-11-14), copied unchanged.
- Topics: the owner's document `Bai-tap-15-chu-de.md`, converted by `scripts/import-topics.mjs`. The file records the source's SHA-256, so a new version of the document can be re-imported and diffed:

```bash
node scripts/import-topics.mjs path/to/Bai-tap-15-chu-de.md
```

The owner assembled the material from large open sources; licence details for each source are the owner's to record before launch.

## Checks

`src/features/levels/content.test.ts` proves every unit and question in the files is read (totals equal `manifest.json`) and every answer key points at a real option. `src/features/levels/levels.test.ts` checks that every answer key grades as correct in the app, and that every topic gives answerable practice in all three languages.
