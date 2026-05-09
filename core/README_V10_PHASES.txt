V10 Phase 1 + Phase 2 base

Added shared JavaScript engines:
- storageEngine.js: unified localStorage profile, migration from legacy istoriaProgress, history log.
- soundEngine.js: shared sound toggle/click feedback.
- uiEngine.js: drawings, page navigation, lesson slides.
- chapterEngine.js: chapter progress, badges, chapter init.
- quizEngine.js: chapter quiz rendering/grading/reset.

Chapter HTML files now load shared engines and keep mostly chapter-specific content, SVGs, custom activities, and question data.
Index and revision also load the shared storage/sound/ui base for compatibility with the next phases.
