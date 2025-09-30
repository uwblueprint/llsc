from typing import Dict, List

from sqlalchemy.orm import Session

from app.models import FormStatus, Quality, User, UserData
from app.models.RankingPreference import RankingPreference


class RankingService:
    def __init__(self, db: Session):
        self.db = db

    def _load_user_and_data(self, user_auth_id: str) -> UserData | None:
        user = self.db.query(User).filter(User.auth_id == user_auth_id).first()
        if not user:
            return None
        return self.db.query(UserData).filter(UserData.user_id == user.id).first()

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

        if target == "patient":
            if case["patient"]:
                add_txs(data.treatments or [], "self")
                add_exps(data.experiences or [], "self")
            else:
                add_txs(data.loved_one_treatments or [], "loved_one")
                add_exps(data.loved_one_experiences or [], "loved_one")
        else:  # caregiver target
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

    # Preferences persistence
    def save_preferences(self, user_auth_id: str, target: str, items: List[Dict]) -> None:
        user = self.db.query(User).filter(User.auth_id == user_auth_id).first()
        if not user:
            raise ValueError("User not found")

        # Validate and normalize
        normalized: List[RankingPreference] = []
        if len(items) > 5:
            raise ValueError("A maximum of 5 ranking items is allowed")

        seen_ranks: set[int] = set()
        seen_keys: set[tuple] = set()
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

            pref = RankingPreference(
                user_id=user.id,
                target_role=target,
                kind=kind,
                quality_id=item_id if kind == "quality" else None,
                treatment_id=item_id if kind == "treatment" else None,
                experience_id=item_id if kind == "experience" else None,
                scope=scope,
                rank=rank,
            )
            normalized.append(pref)

        # Overwrite strategy: delete existing rows for (user, target), then bulk insert
        (
            self.db.query(RankingPreference)
            .filter(RankingPreference.user_id == user.id, RankingPreference.target_role == target)
            .delete(synchronize_session=False)
        )
        if normalized:
            self.db.bulk_save_objects(normalized)

        if user.form_status in (
            FormStatus.RANKING_TODO,
            FormStatus.RANKING_SUBMITTED,
        ):
            user.form_status = FormStatus.RANKING_SUBMITTED

        self.db.commit()
