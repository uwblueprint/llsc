from typing import Dict, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Form, FormSubmission, Quality, User, UserData
from app.models.User import FormStatus


class RankingService:
    def __init__(self, db: Session):
        self.db = db

    def _load_user_and_data(self, user_auth_id: str) -> UserData | None:
        user = self.db.query(User).filter(User.auth_id == user_auth_id).first()
        if not user:
            return None
        return self.db.query(UserData).filter(UserData.user_id == user.id).first()

    def _load_user_and_data_by_user_id(self, user_id: str) -> UserData | None:
        """Load UserData by user_id (UUID string) for admin use."""
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return None
        return self.db.query(UserData).filter(UserData.user_id == user_uuid).first()

    def _infer_case(self, data: UserData) -> Dict[str, bool]:
        has_cancer = (data.has_blood_cancer or "").lower() == "yes"
        caring = (data.caring_for_someone or "").lower() == "yes"
        return {
            "patient": not caring,
            "caregiver_with_cancer": has_cancer and caring,
            "caregiver_without_cancer": (not has_cancer) and caring,
        }

    def _static_qualities(self, data: UserData, target: str, case: Dict[str, bool]) -> List[Dict]:
        qualities = self.db.query(Quality).order_by(Quality.id.asc()).all()
        items: List[Dict] = []
        # Determine allowed_scopes for same_diagnosis
        allow_self_diag = False
        allow_loved_diag = False
        if target == "patient":
            if case["patient"] and data.diagnosis:
                allow_self_diag = True
            if (case["caregiver_with_cancer"] or case["caregiver_without_cancer"]) and data.loved_one_diagnosis:
                allow_loved_diag = True
        else:  # target == caregiver (two-column)
            if data.loved_one_diagnosis:
                allow_loved_diag = True
            if case["caregiver_with_cancer"] and data.diagnosis:
                allow_self_diag = True

        for q in qualities:
            # Default allowed scopes by slug
            # Only age, gender identity, and diagnosis may include loved_one scope
            if q.slug == "same_age":
                allowed_scopes = ["self", "loved_one"]
            elif q.slug == "same_gender_identity":
                allowed_scopes = ["self", "loved_one"]
            elif q.slug == "same_ethnic_or_cultural_group":
                allowed_scopes = ["self"]
            elif q.slug == "same_marital_status":
                allowed_scopes = ["self"]
            elif q.slug == "same_parental_status":
                allowed_scopes = ["self"]
            elif q.slug == "same_diagnosis":
                scopes: List[str] = []
                if allow_self_diag:
                    scopes.append("self")
                if allow_loved_diag:
                    scopes.append("loved_one")
                allowed_scopes = scopes if scopes else []
            else:
                # Any unexpected quality defaults to self only
                allowed_scopes = ["self"]
            items.append(
                {
                    "quality_id": q.id,
                    "slug": q.slug,
                    "label": q.label,
                    "allowed_scopes": allowed_scopes,
                }
            )
        return items

    def _dynamic_options(self, data: UserData, target: str, case: Dict[str, bool]) -> List[Dict]:
        options: List[Dict] = []

        def add_txs(txs, scope: str):
            for t in txs:
                options.append({"kind": "treatment", "id": t.id, "name": getattr(t, "name", str(t.id)), "scope": scope})

        def add_exps(exps, scope: str):
            for e in exps:
                options.append(
                    {"kind": "experience", "id": e.id, "name": getattr(e, "name", str(e.id)), "scope": scope}
                )

        # Show treatments/experiences based on the user's case (their actual situation)
        # regardless of which target (patient/caregiver) they're ranking for
        if case["patient"]:
            # Patient only: show self treatments/experiences only
            add_txs(data.treatments or [], "self")
            add_exps(data.experiences or [], "self")
        elif case["caregiver_without_cancer"]:
            # Caregiver without cancer: show loved_one treatments/experiences only
            add_txs(data.loved_one_treatments or [], "loved_one")
            add_exps(data.loved_one_experiences or [], "loved_one")
        elif case["caregiver_with_cancer"]:
            # Caregiver with cancer: show BOTH self and loved_one treatments/experiences
            add_txs(data.treatments or [], "self")
            add_exps(data.experiences or [], "self")
            add_txs(data.loved_one_treatments or [], "loved_one")
            add_exps(data.loved_one_experiences or [], "loved_one")
        # de-duplicate by (kind,id,scope)
        seen = set()
        deduped: List[Dict] = []
        for opt in options:
            key = (opt["kind"], opt["id"], opt["scope"])
            if key in seen:
                continue
            seen.add(key)
            deduped.append(opt)
        # sort by name for stable UI
        deduped.sort(key=lambda o: (o["scope"], o["kind"], o["name"].lower()))
        return deduped

    def get_options(self, user_auth_id: str, target: str) -> Dict:
        data = self._load_user_and_data(user_auth_id)
        if not data:
            # Return just static qualities if no data
            dummy_case = {"patient": False, "caregiver_with_cancer": False, "caregiver_without_cancer": False}
            return {
                "static_qualities": self._static_qualities(UserData(), target, dummy_case),
                "dynamic_options": [],
            }
        case = self._infer_case(data)
        return {
            "static_qualities": self._static_qualities(data, target, case),
            "dynamic_options": self._dynamic_options(data, target, case),
        }

    def get_options_for_user_id(self, user_id: str, target: str) -> Dict:
        """Get ranking options for a specific user_id (for admin use)."""
        data = self._load_user_and_data_by_user_id(user_id)
        if not data:
            # Return just static qualities if no data
            dummy_case = {"patient": False, "caregiver_with_cancer": False, "caregiver_without_cancer": False}
            return {
                "static_qualities": self._static_qualities(UserData(), target, dummy_case),
                "dynamic_options": [],
            }
        case = self._infer_case(data)
        return {
            "static_qualities": self._static_qualities(data, target, case),
            "dynamic_options": self._dynamic_options(data, target, case),
        }

    def get_case(self, user_auth_id: str) -> Dict:
        """Return inferred participant case and raw flags from UserData."""
        data = self._load_user_and_data(user_auth_id)
        if not data:
            return {
                "case": "caregiver_without_cancer",  # safe default if missing
                "has_blood_cancer": None,
                "caring_for_someone": None,
            }
        inferred = self._infer_case(data)
        case_label = (
            "patient"
            if inferred["patient"]
            else ("caregiver_with_cancer" if inferred["caregiver_with_cancer"] else "caregiver_without_cancer")
        )
        return {
            "case": case_label,
            "has_blood_cancer": data.has_blood_cancer,
            "caring_for_someone": data.caring_for_someone,
        }

    # Preferences persistence - creates form_submission with pending_approval status
    # Actual processing to ranking_preferences happens when admin approves
    def save_preferences(self, user_auth_id: str, target: str, items: List[Dict]) -> None:
        user = self.db.query(User).filter(User.auth_id == user_auth_id).first()
        if not user:
            raise ValueError("User not found")

        # Validate input (fail fast - don't create submission if data is invalid)
        if len(items) > 5:
            raise ValueError("A maximum of 5 ranking items is allowed")

        seen_ranks: set[int] = set()
        seen_keys: set[tuple] = set()
        validated_items = []

        for item in items:
            kind = item.get("kind")
            scope = item.get("scope")
            rank = int(item.get("rank"))
            item_id = item.get("id")

            if kind not in ("quality", "treatment", "experience"):
                raise ValueError(f"Invalid kind: {kind}")
            if scope not in ("self", "loved_one"):
                raise ValueError(f"Invalid scope: {scope}")
            if rank < 1 or rank > 5:
                raise ValueError("rank must be between 1 and 5")
            if rank in seen_ranks:
                raise ValueError("ranks must be unique")
            seen_ranks.add(rank)
            if not isinstance(item_id, int):
                raise ValueError("id must be an integer")

            key = (kind, item_id, scope)
            if key in seen_keys:
                raise ValueError("duplicate item in payload")
            seen_keys.add(key)

            validated_items.append(
                {
                    "kind": kind,
                    "id": item_id,
                    "scope": scope,
                    "rank": rank,
                }
            )

        # NOTE: We no longer process to ranking_preferences here.
        # That happens when admin approves the form submission.

        # Update user form_status to RANKING_SUBMITTED when they submit
        if user.form_status == FormStatus.RANKING_TODO:
            user.form_status = FormStatus.RANKING_SUBMITTED

        # Create or update form_submission record for ranking form
        ranking_form = self.db.query(Form).filter(Form.type == "ranking", Form.name == "Ranking Form").first()
        if not ranking_form:
            raise ValueError("Ranking Form not found in database")

        # Check if submission already exists
        existing_submission = (
            self.db.query(FormSubmission)
            .filter(FormSubmission.user_id == user.id, FormSubmission.form_id == ranking_form.id)
            .first()
        )

        # Build answers dict from validated preferences
        answers = {
            "target": target,
            "preferences": validated_items,
        }

        if existing_submission:
            # Update existing submission and reset to pending
            existing_submission.answers = answers
            existing_submission.status = "pending_approval"
        else:
            # Create new submission with pending status
            new_submission = FormSubmission(
                form_id=ranking_form.id,
                user_id=user.id,
                answers=answers,
                status="pending_approval",
            )
            self.db.add(new_submission)

        self.db.commit()
