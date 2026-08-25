---
'better-hooks': major
---

Freeze the 1.0 public API around 30 direct Hook entries. The aggregate
`better-hooks/use-storage` export is removed; import `useLocalStorage` from
`better-hooks/use-local-storage` and `useSessionStorage` from
`better-hooks/use-session-storage` instead. Keyboard filter arrays now
represent alternatives only; use strings such as `ctrl+s` for chords. Error
observers can no longer replace the original thrown error or rejected promise
when the observer itself fails.
