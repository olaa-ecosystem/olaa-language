# Module Inventory

Modules below are planning placeholders. Before implementation, each module needs purpose, ownership, public interface, data model, dependencies, acceptance criteria, and tests.

## Curriculum
- Purpose: Courses, units and lessons; sequential unlocking of the learning path.
- Public interface: `src/features/curriculum` (COURSES, findLesson, lessonStatuses)
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Lesson Player
- Purpose: Runs a lesson session: queue, retries, hearts, feedback, completion.
- Public interface: `src/features/lesson-player` (LessonPlayer, session engine)
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Vocabulary
- Purpose: Lesson word lists drive picture/select/match exercises and flashcards.
- Public interface: `src/features/curriculum/content.ts`
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Grammar
- Purpose: TBD
- Public interface: TBD
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: Planned

## Listening
- Purpose: TBD
- Public interface: TBD
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: Planned

## Reading
- Purpose: TBD
- Public interface: TBD
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: Planned

## Speaking
- Purpose: TBD
- Public interface: TBD
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: Planned

## Writing
- Purpose: TBD
- Public interface: TBD
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: Planned

## Exercises Assessment
- Purpose: Generates and grades six exercise types with lenient text matching.
- Public interface: `src/features/exercises` (generateLessonExercises, gradeExercise)
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Flashcards Srs
- Purpose: Leitner spaced repetition for learned words.
- Public interface: `src/features/flashcards-srs` (srs.ts, ReviewPage)
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Revision Mistakes
- Purpose: Stores missed exercises and replays them; practice hub.
- Public interface: `src/features/revision-mistakes`
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

## Learning Progress Analytics
- Purpose: Hearts, XP, daily goal, streaks, profile stats.
- Public interface: `src/features/learning-progress`
- Data ownership: TBD
- Dependencies: TBD
- Acceptance criteria: TBD
- Status: MVP implemented (ADR-001)

