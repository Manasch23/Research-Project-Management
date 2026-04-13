from backend.security import hash_password


DEPARTMENTS = [
    {"id": 1, "name": "Computer Science", "code": "CS", "coordinator_user_id": "user-coord-1"},
    {"id": 2, "name": "Electrical Engineering", "code": "EE", "coordinator_user_id": "user-coord-2"},
    {"id": 3, "name": "Mechanical Engineering", "code": "ME", "coordinator_user_id": "user-coord-3"},
    {"id": 4, "name": "Biology", "code": "BIO", "coordinator_user_id": "user-coord-4"},
    {"id": 5, "name": "Chemistry", "code": "CHEM", "coordinator_user_id": "user-coord-5"},
    {"id": 6, "name": "Physics", "code": "PHY", "coordinator_user_id": None},
    {"id": 7, "name": "Mathematics", "code": "MATH", "coordinator_user_id": None},
]


def _user(
    user_id: str,
    name: str,
    email: str,
    password: str,
    role: str,
    department_id: int | None,
    created_at: str,
) -> dict[str, str | int | None]:
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "department_id": department_id,
        "created_at": created_at,
    }


USERS = [
    _user("user-admin-1", "System Administrator", "admin@university.edu", "admin123", "admin", None, "2021-01-01T08:00:00Z"),
    _user("user-fac-1", "Dr. Emily Williams", "dr.williams@university.edu", "faculty123", "faculty", 1, "2023-08-01T08:00:00Z"),
    _user("user-fac-2", "Dr. Carlos Martinez", "dr.martinez@university.edu", "faculty123", "faculty", 2, "2023-06-15T08:00:00Z"),
    _user("user-fac-3", "Dr. Sarah Thompson", "dr.thompson@university.edu", "faculty123", "faculty", 1, "2023-05-20T08:00:00Z"),
    _user("user-fac-4", "Dr. Michael Anderson", "dr.anderson@university.edu", "faculty123", "faculty", 4, "2023-04-10T08:00:00Z"),
    _user("user-fac-5", "Dr. Priya Patel", "dr.patel@university.edu", "faculty123", "faculty", 5, "2023-03-01T08:00:00Z"),
    _user("user-fac-6", "Dr. Robert Johnson", "dr.johnson@university.edu", "faculty123", "faculty", 3, "2023-02-15T08:00:00Z"),
    _user("user-fac-7", "Dr. Jennifer Lee", "dr.lee@university.edu", "faculty123", "faculty", 6, "2023-01-20T08:00:00Z"),
    _user("user-fac-8", "Dr. William Brown", "dr.brown@university.edu", "faculty123", "faculty", 7, "2022-12-10T08:00:00Z"),
    _user("user-fac-9", "Dr. Maria Garcia", "dr.garcia@university.edu", "faculty123", "faculty", 4, "2022-11-05T08:00:00Z"),
    _user("user-fac-10", "Dr. James Taylor", "dr.taylor@university.edu", "faculty123", "faculty", 2, "2022-10-01T08:00:00Z"),
    _user("user-coord-1", "Dr. Robert Chen", "dr.chen@university.edu", "coord123", "coordinator", 1, "2022-01-01T08:00:00Z"),
    _user("user-coord-2", "Dr. Lisa Park", "dr.park@university.edu", "coord123", "coordinator", 2, "2022-03-15T08:00:00Z"),
    _user("user-coord-3", "Dr. James Wilson", "dr.wilson@university.edu", "coord123", "coordinator", 3, "2022-02-10T08:00:00Z"),
    _user("user-coord-4", "Dr. Maria Santos", "dr.santos@university.edu", "coord123", "coordinator", 4, "2022-04-20T08:00:00Z"),
    _user("user-coord-5", "Dr. David Kim", "dr.kim@university.edu", "coord123", "coordinator", 5, "2022-05-15T08:00:00Z"),
    _user("user-stu-1", "John Smith", "john.smith@university.edu", "student123", "student", 1, "2024-01-15T10:00:00Z"),
    _user("user-stu-2", "Sarah Johnson", "sarah.johnson@university.edu", "student123", "student", 1, "2024-02-01T09:00:00Z"),
    _user("user-stu-3", "Mike Davis", "mike.davis@university.edu", "student123", "student", 2, "2024-01-20T10:00:00Z"),
    _user("user-stu-4", "Emma Wilson", "emma.wilson@university.edu", "student123", "student", 4, "2024-03-05T10:00:00Z"),
    _user("user-stu-5", "Alex Turner", "alex.turner@university.edu", "student123", "student", 5, "2024-02-20T10:00:00Z"),
]


PROPOSALS = [
    {
        "id": "prop-1",
        "title": "Machine Learning for Medical Diagnosis",
        "abstract": "This research aims to develop advanced machine learning algorithms for early detection of diseases using medical imaging data.",
        "objectives": "1. Develop CNN-based models for image classification\n2. Create a dataset of annotated medical images\n3. Achieve 95% accuracy in disease detection",
        "methodology": "We will use transfer learning with pre-trained models and fine-tune them on medical imaging datasets.",
        "timeline": "12 months",
        "budget": 25000,
        "status": "approved",
        "submitted_by_id": "user-stu-1",
        "department_id": 1,
        "faculty_advisor_id": "user-fac-1",
        "project_id": "proj-1",
        "created_at": "2024-06-01T10:00:00Z",
        "updated_at": "2024-06-15T14:00:00Z",
    },
    {
        "id": "prop-2",
        "title": "Renewable Energy Storage Solutions",
        "abstract": "Research on advanced battery technologies for efficient storage of renewable energy.",
        "objectives": "1. Analyze current battery technologies\n2. Develop improved storage materials\n3. Test prototype systems",
        "methodology": "Laboratory experiments and computational modeling of energy storage materials.",
        "timeline": "18 months",
        "budget": 45000,
        "status": "under_review",
        "submitted_by_id": "user-stu-3",
        "department_id": 2,
        "faculty_advisor_id": "user-fac-2",
        "project_id": None,
        "created_at": "2024-11-01T10:00:00Z",
        "updated_at": "2024-11-01T10:00:00Z",
    },
    {
        "id": "prop-3",
        "title": "Quantum Computing Algorithms",
        "abstract": "Development of quantum algorithms for optimization problems in logistics.",
        "objectives": "1. Study existing quantum algorithms\n2. Develop new optimization algorithms\n3. Benchmark against classical solutions",
        "methodology": "Theoretical analysis combined with simulation on quantum computing platforms.",
        "timeline": "24 months",
        "budget": 60000,
        "status": "submitted",
        "submitted_by_id": "user-stu-2",
        "department_id": 1,
        "faculty_advisor_id": None,
        "project_id": None,
        "created_at": "2024-12-01T10:00:00Z",
        "updated_at": "2024-12-01T10:00:00Z",
    },
]


REVIEW_COMMENTS = [
    {
        "id": "review-1",
        "proposal_id": "prop-1",
        "reviewer_id": "user-fac-1",
        "comment": "Excellent proposal with clear objectives and methodology. Approved for funding.",
        "decision": "approve",
        "created_at": "2024-06-10T09:00:00Z",
    }
]


PROJECTS = [
    {
        "id": "proj-1",
        "proposal_id": "prop-1",
        "title": "Machine Learning for Medical Diagnosis",
        "description": "Developing ML algorithms for early disease detection using medical imaging.",
        "status": "in_progress",
        "progress": 45,
        "start_date": "2024-07-01",
        "end_date": "2025-06-30",
        "lead_researcher_id": "user-stu-1",
        "faculty_advisor_id": "user-fac-1",
        "department_id": 1,
        "created_at": "2024-07-01T08:00:00Z",
        "updated_at": "2025-01-10T12:00:00Z",
    },
    {
        "id": "proj-2",
        "proposal_id": None,
        "title": "Smart Grid Optimization",
        "description": "Developing algorithms for efficient energy distribution in smart grids.",
        "status": "in_progress",
        "progress": 60,
        "start_date": "2024-08-15",
        "end_date": "2025-11-14",
        "lead_researcher_id": "user-stu-3",
        "faculty_advisor_id": "user-fac-10",
        "department_id": 2,
        "created_at": "2024-08-15T08:00:00Z",
        "updated_at": "2025-01-15T14:00:00Z",
    },
    {
        "id": "proj-3",
        "proposal_id": None,
        "title": "Natural Language Processing for Legal Documents",
        "description": "Developing NLP models to automate legal document analysis and contract review.",
        "status": "open",
        "progress": 0,
        "start_date": "2025-02-01",
        "end_date": "2026-01-31",
        "lead_researcher_id": None,
        "faculty_advisor_id": "user-fac-3",
        "department_id": 1,
        "created_at": "2025-01-10T08:00:00Z",
        "updated_at": "2025-01-10T08:00:00Z",
    },
]


PROJECT_MEMBERS = [
    {"project_id": "proj-1", "user_id": "user-stu-1"},
    {"project_id": "proj-1", "user_id": "user-stu-2"},
    {"project_id": "proj-2", "user_id": "user-stu-3"},
]


MILESTONES = [
    {
        "id": "mile-1",
        "project_id": "proj-1",
        "title": "Literature Review",
        "description": "Complete comprehensive review of existing ML techniques in medical imaging.",
        "due_date": "2024-08-31",
        "completed": 1,
        "completed_at": "2024-08-25T16:00:00Z",
    },
    {
        "id": "mile-2",
        "project_id": "proj-1",
        "title": "Dataset Collection",
        "description": "Collect and annotate medical imaging dataset.",
        "due_date": "2024-11-30",
        "completed": 1,
        "completed_at": "2024-11-28T14:00:00Z",
    },
    {
        "id": "mile-3",
        "project_id": "proj-1",
        "title": "Model Development",
        "description": "Develop and train initial CNN models.",
        "due_date": "2025-02-28",
        "completed": 0,
        "completed_at": None,
    },
    {
        "id": "mile-4",
        "project_id": "proj-2",
        "title": "Algorithm Development",
        "description": "Develop optimization algorithms for energy distribution.",
        "due_date": "2025-02-28",
        "completed": 1,
        "completed_at": "2025-01-15T14:00:00Z",
    },
]


PROGRESS_UPDATES = [
    {
        "id": "update-1",
        "project_id": "proj-1",
        "submitted_by_id": "user-stu-1",
        "content": "Completed the literature review phase. Identified 50+ relevant papers on CNN applications in medical imaging.",
        "created_at": "2024-08-25T16:00:00Z",
    },
    {
        "id": "update-2",
        "project_id": "proj-2",
        "submitted_by_id": "user-stu-3",
        "content": "Optimization algorithm development complete. Implemented genetic algorithm approach showing 15% improvement over baseline methods.",
        "created_at": "2025-01-15T14:00:00Z",
    },
]


APPLICATIONS = [
    {
        "id": "app-1",
        "project_id": "proj-1",
        "applicant_id": "user-stu-3",
        "cover_letter": "I am very interested in joining this project. I have experience in deep learning and medical imaging analysis.",
        "status": "pending",
        "created_at": "2025-01-15T10:00:00Z",
    },
    {
        "id": "app-2",
        "project_id": "proj-3",
        "applicant_id": "user-stu-2",
        "cover_letter": "I have strong background in NLP and would love to apply my skills to this legal document analysis project.",
        "status": "pending",
        "created_at": "2025-01-18T10:00:00Z",
    },
]


AUDIT_LOGS = [
    {
        "id": "log-1",
        "user_id": "user-stu-1",
        "action": "PROPOSAL_SUBMITTED",
        "details": "Submitted proposal: Machine Learning for Medical Diagnosis",
        "timestamp": "2024-06-01T10:00:00Z",
    },
    {
        "id": "log-2",
        "user_id": "user-fac-1",
        "action": "PROPOSAL_APPROVED",
        "details": "Approved proposal: Machine Learning for Medical Diagnosis",
        "timestamp": "2024-06-15T14:00:00Z",
    },
    {
        "id": "log-3",
        "user_id": "user-admin-1",
        "action": "USER_CREATED",
        "details": "Created new user account: mike.davis@university.edu",
        "timestamp": "2024-01-20T10:00:00Z",
    },
]
