# Intake Form API Documentation

## Overview

The Intake Form API handles the processing of participant and volunteer intake forms, automatically detecting form types and processing complex nested JSON data into structured database records.

## Endpoints

### `POST /intake/submissions`

Create a new form submission and process it into structured data.

**Authentication**: Required (Participant, Volunteer, or Admin role)

**Request Body**:
```json
{
  "form_id": "uuid (optional - auto-detected from formType)",
  "answers": {
    "formType": "participant|volunteer",
    "hasBloodCancer": "yes|no", 
    "caringForSomeone": "yes|no",
    "personalInfo": {
      "firstName": "string (required)",
      "lastName": "string (required)",
      "dateOfBirth": "DD/MM/YYYY (required)",
      "phoneNumber": "string (required)",
      "city": "string (required)",
      "province": "string (required)",
      "postalCode": "string (required)",
      "email": "string (optional)"
    },
    "demographics": {
      "genderIdentity": "string (optional)",
      "pronouns": ["array of strings (optional)"],
      "ethnicGroup": ["array of strings (optional)"],
      "maritalStatus": "string (optional)",
      "hasKids": "Yes|No|Prefer not to answer (optional)",
      "ethnicGroupCustom": "string (optional)",
      "genderIdentityCustom": "string (optional)"
    },
    "cancerExperience": {
      "diagnosis": "string (optional)",
      "dateOfDiagnosis": "DD/MM/YYYY (optional)",
      "treatments": ["array of treatment names (optional)"],
      "experiences": ["array of experience names (optional)"],
    },
    "lovedOne": {
      "demographics": {
        "genderIdentity": "string (optional)",
        "age": "string (optional)"
      },
      "cancerExperience": {
        "diagnosis": "string (optional)",
        "dateOfDiagnosis": "DD/MM/YYYY (optional)",
        "treatments": ["array of treatment names (optional)"],
        "experiences": ["array of experience names (optional)"],
      }, 
    },
    "additional_info": "string (optional)",
  }
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "form_id": "uuid",
  "answers": "object",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Error Responses**:
- `400`: Missing required fields, invalid form type, or malformed data
- `401`: Authentication required
- `500`: Server error during processing

## Form Type Auto-Detection

The API automatically detects form types based on the `formType` field in the answers:

- `"participant"` → Maps to "Participant Intake Form"
- `"volunteer"` → Maps to "Volunteer Intake Form"

## Data Processing Flow

1. **Validation**: Required fields are validated strictly
2. **Text Processing**: All text fields are automatically trimmed
3. **Date Parsing**: Dates are parsed in DD/MM/YYYY format with fallback to ISO format
4. **Relationship Handling**: Many-to-many relationships for treatments/experiences are processed
5. **User Data Creation**: Data is mapped to structured UserData model with proper foreign keys
6. **Form Submission Storage**: Raw JSON is stored in FormSubmission table for audit trail

## Flow Logic

The system handles 8 different user flow combinations:

### Participant Flows:
1. **Cancer Patient Only**: `hasBloodCancer=yes`, `caringForSomeone=no`
2. **Caregiver Without Cancer**: `hasBloodCancer=no`, `caringForSomeone=yes`
3. **Cancer Patient + Caregiver**: `hasBloodCancer=yes`, `caringForSomeone=yes`
4. **No Cancer Experience**: `hasBloodCancer=no`, `caringForSomeone=no`

### Volunteer Flows:
5. **Cancer Patient Only**: `hasBloodCancer=yes`, `caringForSomeone=no`
6. **Caregiver Without Cancer**: `hasBloodCancer=no`, `caringForSomeone=yes`
7. **Cancer Patient + Caregiver**: `hasBloodCancer=yes`, `caringForSomeone=yes`
8. **No Cancer Experience**: `hasBloodCancer=no`, `caringForSomeone=no`

## Database Schema

### UserData Table
Stores processed, structured user information with proper relationships to User table via `user_id` foreign key.

### FormSubmission Table  
Stores raw JSON submissions for audit trail and potential reprocessing.

### Many-to-Many Relationships
- `user_treatments`: Links users to their cancer treatments
- `user_experiences`: Links users to their cancer experiences  
- `user_loved_one_treatments`: Links users to their loved ones' treatments
- `user_loved_one_experiences`: Links users to their loved ones' experiences

## Error Handling

The system implements robust error handling with:
- **Input Validation**: Strict validation of required fields
- **Date Validation**: Proper date format validation with clear error messages  
- **Database Rollback**: Automatic rollback on processing errors
- **SQL Injection Prevention**: Uses parameterized queries and ORM
- **Unicode Support**: Full support for international characters and emojis

## Example Requests

### Participant with Cancer
```bash
curl -X POST "/intake/submissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "formType": "participant",
      "hasBloodCancer": "yes",
      "caringForSomeone": "no",
      "personalInfo": {
        "firstName": "John",
        "lastName": "Doe", 
        "dateOfBirth": "15/03/1980",
        "phoneNumber": "555-123-4567",
        "city": "Toronto",
        "province": "Ontario",
        "postalCode": "M5V 3A1"
      },
      "cancerExperience": {
        "diagnosis": "Leukemia",
        "dateOfDiagnosis": "10/01/2020",
        "treatments": ["Chemotherapy", "Radiation Therapy"],
        "experiences": ["Fatigue", "Depression"]
      }, 
      "additional_info": "",
    }
  }'
```

### Volunteer Caregiver  
```bash
curl -X POST "/intake/submissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "formType": "volunteer",
      "hasBloodCancer": "no", 
      "caringForSomeone": "yes",
      "personalInfo": {
        "firstName": "Jane",
        "lastName": "Smith",
        "dateOfBirth": "22/07/1975",
        "phoneNumber": "555-987-6543", 
        "city": "Vancouver",
        "province": "British Columbia",
        "postalCode": "V6B 2W9"
      },
      "lovedOne": {
        "demographics": {
          "genderIdentity": "Male",
          "age": "45-54"
        },
        "cancerExperience": {
          "diagnosis": "Lymphoma",
          "dateOfDiagnosis": "05/06/2022",
          "treatments": ["Chemotherapy"],
          "experiences": ["Hair Loss", "Anxiety"]
        }
      },
      "additional_info": "string (optional)",
    }
  }'
``` 
