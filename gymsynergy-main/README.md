# Final Gym App

A full-stack application for gym management and workout planning.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Cloud Platform account
- Firebase project

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/uestliguci/Final_Gym_App.git
cd Final_Gym_App
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server Configuration
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

### Prerequisites for Deployment

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Create a new project in Google Cloud Console
3. Enable the following APIs:
   - Cloud Run API
   - Container Registry API
   - Cloud Build API

### Setting up GitHub Actions

1. Create a service account in Google Cloud Console with the following roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Service Account User
   - Storage Admin

2. Generate a JSON key for the service account

3. Add the following secrets to your GitHub repository:
   - `GCP_SA_KEY`: The content of the service account JSON key
   - `GCP_PROJECT_ID`: Your Google Cloud project ID

### Manual Deployment

1. Build the Docker image:
```bash
docker build -t gcr.io/[PROJECT_ID]/final-gym-app .
```

2. Push to Container Registry:
```bash
docker push gcr.io/[PROJECT_ID]/final-gym-app
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy final-gym-app \
  --image gcr.io/[PROJECT_ID]/final-gym-app \
  --platform managed \
  --region europe-west4 \
  --allow-unauthenticated
```

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utility functions and configurations
│   ├── pages/         # Page components
│   └── server/        # Backend server code
├── public/            # Static files
├── .github/           # GitHub Actions workflows
└── package.json       # Project dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License.
