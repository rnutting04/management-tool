# Management Tool

A full-stack management application built with a React frontend, Python backend, and Terraform-managed infrastructure.

## Tech Stack

- **Frontend:** React (TypeScript)
- **Backend:** Python
- **Infrastructure:** Terraform (HCL)
- **Scripting:** Shell / JavaScript

## Project Structure
```
management-tool/
├── frontend/
│   └── react-management/   # React TypeScript frontend
├── backend/                # Python backend API
├── infrastructure/         # Terraform infrastructure configs
└── scripts/                # Utility/deployment scripts
```

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.x
- Terraform

### Frontend
```bash
cd frontend/react-management
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Infrastructure
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## License

MIT License — see [LICENSE](./LICENSE) for details.
