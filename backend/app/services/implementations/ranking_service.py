from typing import Dict, List

from sqlalchemy.orm import Session

from app.models import Quality, User, UserData


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
            allowed_scopes = ["self", "loved_one"]
            if q.slug == "same_diagnosis":
                scopes: List[str] = []
                if allow_self_diag:
                    scopes.append("self")
                if allow_loved_diag:
                    scopes.append("loved_one")
                allowed_scopes = scopes if scopes else []
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
