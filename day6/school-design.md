# School Database Design

## Table Explanations & Purpose
- **students**: Stores core identity information for individuals registered at the school. It holds a unique structural ID, their name, and an enforced unique email configuration for authentication purposes.
- **courses**: Houses the catalog of academic modules available for study. Each entry tracks the course title and a unique functional academic code.
- **enrolments**: Operates as a relational bridge capturing the contextual event of a student signing up for a specific course, alongside their performance evaluation (grade).

## Entity Relationships
The relationship between `students` and `courses` is natively **many-to-many**, because a single student can take multiple courses simultaneously, and a single course can be attended by many different students. 

Relational database systems cannot map a direct split-array relationship across two tables without violating normalization rules (such as storing comma-separated values). Therefore, a intermediate **join table** (`enrolments`) is required. This table breaks the complex many-to-many scheme down into two manageable **one-to-many** relationships:
- One student can have *many* enrolment records.
- One course can contain *many* enrolment records.

## Database Indexing Strategy
To optimize performance as the scale grows, I would explicitly add an index to the foreign key columns within the join table:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
```

**Reason:** In a production school landscape, administrators constantly pull class rosters (finding all students registered to a specific class ID). Because querying this relationship involves highly frequent sorting and filtering operations across `course_id`, adding a B-Tree index speeds up structural table merges (`JOIN` lookups) and prevents slow, heavy sequential table scans.

## System Paradigm Choice: SQL vs. NoSQL
For a school management system tracking registrations and grading, **SQL is the structurally superior choice**. Educational records rely heavily on data integrity, strict consistency, and bulletproof relational tracking. If an admin deletes a course profile or updates a student profile, transactional changes must securely propagate across the database automatically. SQL’s native support for ACID properties, foreign key constraints, and relational enforcement (like preventing double-enrolments through composite unique constraints) safeguards against corrupted records. 

A NoSQL model, which favors eventual consistency and horizontal denormalization, would introduce major data syncing risks—such as grades orphaned from a deleted student ID or conflicting structural references that are difficult to reconcile programmatically.
