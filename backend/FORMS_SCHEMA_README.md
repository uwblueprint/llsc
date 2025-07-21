# Forms Schema Documentation

This document describes the database schema for the forms system that was implemented.

## Tables Created

### 1. Core User Data

#### `user_data`
Stores single-valued user fields:
- `id` - UUID primary key
- `date_of_birth` - Date field
- `email` - String field
- `phone` - String field

### 2. Multi-valued Reference Tables

#### `treatments`
Stores available treatment options:
- `id` - Integer primary key
- `name` - Unique treatment name

Pre-populated with:
- Chemotherapy, Immunotherapy, Radiation Therapy, Surgery, Targeted Therapy, Hormone Therapy, Stem Cell Transplant, CAR-T Cell Therapy, Clinical Trial, Palliative Care

#### `experiences`
Stores cancer-related experiences:
- `id` - Integer primary key  
- `name` - Unique experience name

Pre-populated with:
- PTSD, Relapse, Anxiety, Depression, Fatigue, Neuropathy, Hair Loss, Nausea, Loss of Appetite, Sleep Problems, Cognitive Changes, Financial Stress, Relationship Changes, Body Image Issues, Survivorship Concerns

#### `qualities`
Stores ranking/matching qualities:
- `id` - Integer primary key
- `slug` - Unique identifier (e.g., 'same_age')
- `label` - Human-readable description

Pre-populated with matching criteria like same age, diagnosis, treatment, location, etc.

### 3. Bridge Tables (Many-to-Many)

#### `user_treatments`
Links users to their treatments

#### `user_experiences` 
Links users to their experiences

### 4. Ranking System

#### `ranking_preferences`
Stores user ranking preferences:
- `user_id` - Reference to users table
- `quality_id` - Reference to qualities table
- `rank` - Integer ranking (1 = most important)

### 5. Form System

#### `forms`
Form definitions and versioning:
- `id` - UUID primary key
- `name` - Form name
- `version` - Version number
- `type` - Enum (intake, ranking, secondary, become_volunteer, become_participant)

#### `form_submissions`
Raw form submission data:
- `id` - UUID primary key
- `form_id` - Reference to forms table
- `user_id` - Reference to users table  
- `submitted_at` - Timestamp
- `answers` - JSONB field with raw form data

## Usage Examples

### Accessing Multi-valued Fields
Thanks to SQLAlchemy relationships, you can access multi-valued fields as lists:

```python
from app.models import UserData

# Get a user
user = session.query(UserData).first()

# Access treatments as a list
user_treatments = user.treatments  # Returns list of Treatment objects
treatment_names = [t.name for t in user.treatments]

# Access experiences as a list  
user_experiences = user.experiences  # Returns list of Experience objects
```

### Creating Form Submissions
```python
from app.models import FormSubmission
import json

submission = FormSubmission(
    form_id=form_uuid,
    user_id=user_uuid,
    answers={
        "date_of_birth": "1990-01-01",
        "treatments": ["Chemotherapy", "Radiation Therapy"],
        "experiences": ["Anxiety", "Fatigue"],
        # ... other form fields
    }
)
session.add(submission)
session.commit()
```

### Setting Ranking Preferences
```python
from app.models import RankingPreference

# User ranks "same_diagnosis" as most important (rank 1)
pref = RankingPreference(
    user_id=user_uuid,
    quality_id=2,  # same_diagnosis quality
    rank=1
)
session.add(pref)
session.commit()
```

## Form Processing Workflow

1. **Form Submission**: Raw data stored in `form_submissions.answers` as JSON
2. **Data Parsing**: Custom parser extracts structured data from JSON
3. **Database Population**: Parsed data populates `user_data` and relationship tables
4. **Versioning**: Multiple submissions create new form versions while preserving history

This design allows for:
- Flexible form structures without schema changes
- Historical tracking of all submissions
- Structured querying of user data for matching algorithms
- Easy addition of new treatment/experience/quality options 
