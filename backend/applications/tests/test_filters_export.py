import pytest

from applications.models import Application

from .factories import make_admin, valid_medic_payload, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
LIST_URL = "/api/admin/applications/"
EXPORT_URL = "/api/admin/applications/export/"
UNIVERSITIES_URL = "/api/admin/applications/universities/"


def test_role_filter_hides_position_and_shows_certificate_filter_only_for_referee(api_client):
    """Not a literal backend assertion (role-conditional UI is a frontend
    concern) — but confirms the backend filters referees correctly when
    only `referee_certified` is combined with role=referee, which is what
    that frontend behavior depends on."""
    admin = make_admin()
    certified_resp = api_client.post(
        REGISTER_URL,
        valid_referee_payload(
            phone="+994501110001",
            referee_details={
                "has_official_certification": True,
                "certification_name": "FIFA",
                "years_refereeing": "3_5",
                "game_types": ["mini_football"],
                "experience_text": "",
            },
        ),
        format="json",
    )
    uncertified_resp = api_client.post(
        REGISTER_URL, valid_referee_payload(phone="+994501110002"), format="json"
    )
    assert certified_resp.status_code == 201, certified_resp.data
    assert uncertified_resp.status_code == 201

    api_client.force_authenticate(user=admin)
    resp = api_client.get(LIST_URL, {"role": "referee", "referee_certified": "yes"})
    ids = {a["id"] for a in resp.data["results"]}
    assert certified_resp.data["id"] in ids
    assert uncertified_resp.data["id"] not in ids


def test_also_plays_position_matches_main_and_extra_by_default(api_client):
    admin = make_admin()
    resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501110003"), format="json"
    )
    assert resp.status_code == 201
    application = Application.objects.get(id=resp.data["id"])
    application.player_details.main_position = "forward"
    application.player_details.extra_positions = ["midfielder"]
    application.player_details.save()

    api_client.force_authenticate(user=admin)

    default_resp = api_client.get(LIST_URL, {"position": "midfielder"})
    assert str(application.id) in {a["id"] for a in default_resp.data["results"]}

    main_only_resp = api_client.get(
        LIST_URL, {"position": "midfielder", "position_mode": "main_only"}
    )
    assert str(application.id) not in {a["id"] for a in main_only_resp.data["results"]}

    main_only_forward_resp = api_client.get(
        LIST_URL, {"position": "forward", "position_mode": "main_only"}
    )
    assert str(application.id) in {a["id"] for a in main_only_forward_resp.data["results"]}


def test_student_plus_level_plus_price_filters_combine_with_and(api_client):
    admin = make_admin()
    matching_resp = api_client.post(
        REGISTER_URL,
        valid_player_payload(
            phone="+994501110004",
            player_details={
                "main_position": "midfielder",
                "extra_positions": [],
                "preferred_foot": "right",
                "years_playing": "3_5",
                "club_experience_text": "",
                "experience_level": "semi_pro",
                "has_pro_experience": False,
                "hourly_rate_azn": 20,
                "is_university_student": True,
                "university_name": "ADA University",
                "course_year": 2,
            },
        ),
        format="json",
    )
    non_matching_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501110005"), format="json"
    )
    assert matching_resp.status_code == 201, matching_resp.data
    assert non_matching_resp.status_code == 201

    api_client.force_authenticate(user=admin)
    resp = api_client.get(
        LIST_URL,
        {
            "role": "player",
            "level": "semi_pro",
            "is_student": "yes",
            "price_max": "25",
        },
    )
    ids = {a["id"] for a in resp.data["results"]}
    assert matching_resp.data["id"] in ids
    assert non_matching_resp.data["id"] not in ids


def test_age_range_filter(api_client):
    from datetime import date

    admin = make_admin()
    young_dob = date.today().replace(year=date.today().year - 20).isoformat()
    old_dob = date.today().replace(year=date.today().year - 40).isoformat()

    young_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501110006", date_of_birth=young_dob), format="json"
    )
    old_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501110007", date_of_birth=old_dob), format="json"
    )
    assert young_resp.status_code == 201
    assert old_resp.status_code == 201

    api_client.force_authenticate(user=admin)
    resp = api_client.get(LIST_URL, {"age_min": "18", "age_max": "25"})
    ids = {a["id"] for a in resp.data["results"]}
    assert young_resp.data["id"] in ids
    assert old_resp.data["id"] not in ids


def test_medic_has_document_filter(api_client):
    import uuid

    from common.enums import FileKind

    from .factories import make_file

    admin = make_admin()
    payload = valid_medic_payload(phone="+994501110008")
    upload_session_id = uuid.UUID(payload["upload_session_id"])
    doc = make_file(upload_session_id, kind=FileKind.DOCUMENT, original_name="diploma.pdf")
    payload["file_ids"].append(str(doc.id))
    with_doc_resp = api_client.post(REGISTER_URL, payload, format="json")
    assert with_doc_resp.status_code == 201, with_doc_resp.data

    # The public API can't itself produce a documentless medic (the medic
    # branch requires >=1 document) — create one directly via the ORM to
    # get a comparison row for the filter, matching the pattern already
    # used in test_duplicate_phone_report.py.
    from applications.models import Application
    from applications.services import generate_display_id
    from common.enums import ApplicationRole, District

    no_doc_app = Application.objects.create(
        role=ApplicationRole.MEDIC,
        display_id=generate_display_id(ApplicationRole.MEDIC),
        full_name="No Document Medic",
        date_of_birth="1990-01-01",
        phone="+994501110010",
        district=District.SEBAIL,
        upload_session_id=uuid.uuid4(),
    )

    api_client.force_authenticate(user=admin)
    resp = api_client.get(LIST_URL, {"role": "medic", "medic_has_document": "yes"})
    ids = {a["id"] for a in resp.data["results"]}
    assert with_doc_resp.data["id"] in ids
    assert str(no_doc_app.id) not in ids


def test_universities_endpoint_returns_distinct_names(api_client):
    admin = make_admin()
    api_client.post(
        REGISTER_URL,
        valid_player_payload(
            phone="+994501110011",
            player_details={
                "main_position": "forward",
                "extra_positions": [],
                "preferred_foot": "right",
                "years_playing": "3_5",
                "club_experience_text": "",
                "experience_level": "amateur",
                "has_pro_experience": False,
                "hourly_rate_azn": 15,
                "is_university_student": True,
                "university_name": "Baku State University",
                "course_year": 1,
            },
        ),
        format="json",
    )

    api_client.force_authenticate(user=admin)
    resp = api_client.get(UNIVERSITIES_URL)
    assert resp.status_code == 200
    assert "Baku State University" in resp.data


def test_admin_fields_endpoint_sets_rating_and_level(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501110012"), format="json")
    assert resp.status_code == 201
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    patch_resp = api_client.patch(
        f"/api/admin/applications/{app_id}/admin-fields/",
        {"admin_rating": 4, "admin_experience_level": "former_pro"},
        format="json",
    )
    assert patch_resp.status_code == 200, patch_resp.data
    assert patch_resp.data["admin_rating"] == 4
    assert patch_resp.data["player_details"]["admin_experience_level"] == "former_pro"


def test_export_respects_column_selection_and_filters(api_client):
    admin = make_admin()
    resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501110013", full_name="Export Row"), format="json"
    )
    assert resp.status_code == 201

    api_client.force_authenticate(user=admin)
    export_resp = api_client.get(EXPORT_URL, {"format": "csv", "columns": "full_name,phone"})
    assert export_resp.status_code == 200
    content = export_resp.content.decode("utf-8-sig")
    header_line = content.splitlines()[0]
    assert header_line == "Ad soyad,Telefon"
    assert "Export Row" in content
    assert "futbolio_namizedler_" in export_resp["Content-Disposition"]


def test_export_all_columns_includes_azerbaijani_headers(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501110014"), format="json")
    assert resp.status_code == 201

    api_client.force_authenticate(user=admin)
    export_resp = api_client.get(EXPORT_URL, {"format": "csv"})
    assert export_resp.status_code == 200
    content = export_resp.content.decode("utf-8-sig")
    header_line = content.splitlines()[0]
    for expected in ["Ad soyad", "Doğum tarixi", "Yaş", "Səviyyə (özü)", "Tələbə", "Qeydiyyat tarixi"]:
        assert expected in header_line


def test_export_resolves_enum_codes_to_azerbaijani_labels_not_raw_codes(api_client):
    """Regression test: district/role/status/position/level used to export
    as their raw stored codes (e.g. "binegedi") instead of the proper
    Azerbaijani label ("Binəqədi")."""
    admin = make_admin()
    resp = api_client.post(
        REGISTER_URL,
        valid_player_payload(
            phone="+994501110015",
            district="binegedi",
            player_details={
                "main_position": "forward",
                "extra_positions": ["midfielder"],
                "preferred_foot": "right",
                "years_playing": "3_5",
                "club_experience_text": "",
                "experience_level": "semi_pro",
                "has_pro_experience": False,
                "hourly_rate_azn": 20,
                "is_university_student": False,
            },
        ),
        format="json",
    )
    assert resp.status_code == 201, resp.data
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    api_client.patch(
        f"/api/admin/applications/{app_id}/status/", {"status": "accepted"}, format="json"
    )

    export_resp = api_client.get(
        EXPORT_URL,
        {"format": "csv", "columns": "role,district,main_position,extra_positions,level_self,status"},
    )
    assert export_resp.status_code == 200
    content = export_resp.content.decode("utf-8-sig")
    lines = content.splitlines()
    # Column order always follows EXPORT_COLUMN_REGISTRY's own fixed
    # order, not the order columns were requested in.
    assert lines[0] == "Rol,Əsas mövqe,Oynaya bildiyi zonalar,Səviyyə (özü),Status,Rayon"
    data_line = lines[1]
    assert "Futbolçu" in data_line
    assert "Binəqədi" in data_line
    assert "Hücumçu" in data_line
    assert "Yarımmüdafiəçi" in data_line
    assert "Yarı-peşəkar" in data_line
    assert "Qəbul edilib" in data_line
    # None of the raw codes should leak through.
    assert "binegedi" not in content
    assert "player" not in content
    assert "forward" not in content
    assert "midfielder" not in content
    assert "semi_pro" not in content
    assert "accepted" not in content
