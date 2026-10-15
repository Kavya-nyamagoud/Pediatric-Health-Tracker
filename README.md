# Pediatric Health Tracker for Parents

An AI-powered healthcare application designed to help parents manage their child's complete health journey in one unified digital platform.

## Features

- **Growth Monitoring**: Track and visualize your child's growth using WHO/CDC growth charts
- **Vaccination Tracking**: Never miss an important vaccination with automated reminders
- **Medical History**: Securely store and access your child's complete medical history
- **Health Analytics**: AI-powered insights to detect potential health concerns early
- **Secure Sharing**: Share health records with doctors and caregivers as needed
- **Multi-Platform**: Access via web and mobile applications

## Tech Stack

### Frontend
- React.js (Web)
- Flutter (Mobile - Coming Soon)
- Vite (Build Tool)
- Chart.js (Data Visualization)

### Backend
- Node.js with Express
- MongoDB (via Mongoose)
- Firebase Authentication
- TensorFlow.js (AI/ML)

### Infrastructure
- Docker (Containerization)
- GitHub Actions (CI/CD)
- AWS/GCP (Deployment)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or Yarn
- MongoDB (v6 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pediatric-health-tracker.git
   cd pediatric-health-tracker
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with your API endpoints
   ```

4. **Start the development servers**
   - In the backend directory: `npm run dev`
   - In the frontend directory: `npm run dev`

## Project Structure

```
PediatricHealthTracker/
├── ai_model/          # AI/ML models and training scripts
├── backend/           # Node.js/Express backend
├── database/          # Database schemas and migrations
├── docs/             # Project documentation
└── frontend/         # React frontend application
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- WHO/CDC growth standards
- Open-source community for amazing libraries and tools
