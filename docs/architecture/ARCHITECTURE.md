# Architecture — OLAA Language

## 1. Architecture Principles
- Independent application
- Domain-driven module boundaries
- Type-safe code
- API-first integration
- Offline-aware
- Secure by default
- Testable
- Accessible
- Maintainable
- Incremental migration

## 2. Application Layers

Presentation Layer
    ↓
Feature Layer
    ↓
Application Services
    ↓
Domain Logic
    ↓
Infrastructure / API / Persistence

## 3. Domain Boundaries
Each feature owns its components, types, services, state, and tests.

## 4. Cross-feature Communication
Features communicate through explicit interfaces.
Direct access to internal feature state is prohibited.

## 5. External Integration
All external communication is performed through typed service adapters.

## 6. Persistence
Persistence must be accessed through repository abstractions.
Components must not access database storage directly.

## 7. Authentication
Authentication is delegated to OLAA ID through approved integration contracts.

## 8. Failure Isolation
Optional integrations must not prevent core application usage.

## 9. Architecture Changes
Breaking or major architecture changes require an Architecture Decision Record.
