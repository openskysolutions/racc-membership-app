# Data Model

## Entities
- Member: id, name, email, status, profile, createdAt, updatedAt
- Nomination: id, nomineeName, nomineeContact, submitterId (nullable), notes, status, createdAt
- Event: id, title, description, startsAt, endsAt, location, visibility, ownerId, version, createdAt, updatedAt
- DiscussionTopic: id, title, createdBy, createdAt
- DiscussionPost: id, topicId, authorId, body, hidden, createdAt, updatedAt
- Course: id, title, modules[], createdAt
- CourseProgress: id, courseId, memberId, progress, completedAt
- JobListing: id, title, company, location, description, status, ownerId, createdAt, updatedAt
- News: id, title, body, tags[], publishedAt, ownerId, createdAt, updatedAt
- ModerationLog: id, actorId, action, targetType, targetId, reason, createdAt
- Role: id, name (visitor|member|admin|content-manager)
- ContentLimitPolicy: id, type (news|event|job), perMemberLimit, effectiveFrom

## Relationships
- Member 1..* → Event (owner)
- Member 1..* → JobListing (owner)
- Member 1..* → News (owner)
- DiscussionTopic 1..* → DiscussionPost
- Course 1..* → CourseProgress

## Validation Rules
- Event: endsAt ≥ startsAt; title required; version required for updates
- JobListing/News: title and body/description required
- Nomination: nomineeName and contact required
- Limits: creation blocked when existing count ≥ perMemberLimit for the content type
