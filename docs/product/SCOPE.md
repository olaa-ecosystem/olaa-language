# Product Scope — Olaa Language

## Purpose
Define the exact ownership and boundaries of Olaa Language.

## IN SCOPE
- Language curriculum
- Lesson delivery
- Vocabulary
- Grammar
- Language skills
- Exercises and assessments
- Flashcards and SRS
- Learning progress
- Study sessions
- Learning analytics
- Mistake review
- Learning preferences

## OUT OF SCOPE
- Full notebook editor
- Freeform handwriting canvas
- PDF annotation workspace
- General-purpose habit tracking
- General-purpose routine planner
- Cross-app account management
- Shared identity provider implementation

## INTEGRATIONS
- Olaa Identity (`olaa-platform`, branch 00.03) for authentication
- Olaa TakeNote for linked learning notes
- Olaa Habits for study habit tracking

## BOUNDARY RULE
Olaa Language owns language-learning domain data.
Other applications must not directly modify Olaa Language data.

## CHANGE CONTROL
Any scope expansion must be documented and approved before implementation.
