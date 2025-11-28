# HealLink

HealLink is a user-friendly Health Risk Predictor and Telemedicine Portal that uses rule-based logic to assess health risks based on symptoms entered by users. It allows users to get instant health assessments with specialist recommendations.

## 🚀 Features

- **Health Risk Prediction**: Rule-based symptom analysis to assess health risks
- **Interactive Frontend**: Modern, responsive web interface
- **Real-time Assessment**: Instant health risk evaluation based on symptoms, age, and gender
- **Specialist Recommendations**: Suggests appropriate medical specialists based on symptoms
- **Professional UI/UX**: Clean, medical-focused design with smooth animations

## 🏗️ Project Structure

```
HealLink/
├── index.html          # Main frontend page
├── style.css           # Responsive styling
├── script.js           # Frontend interactions
├── backend/
│   ├── server.js       # Express.js server
│   ├── package.json    # Backend dependencies
│   ├── routes/
│   │   └── healthPredictionRoute.js
│   └── services/
│       └── healthPredictionService.js
├── test-api.html       # API testing page
├── LICENSE             # MIT License
└── README.md           # This file
```

## ⚡ Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python (for frontend server)

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```
Server will run on `http://localhost:5000`

### 2. Start the Frontend Server
```bash
# In the project root directory
python -m http.server 3000
```
Frontend will be available at `http://localhost:3000`

### 3. Test the Application
1. Open `http://localhost:3000` in your browser
2. Navigate to the "Health Risk Prediction" section
3. Enter symptoms, age, and gender
4. Click "Analyze" to get health risk assessment

## 🔧 API Endpoints

### Health Risk Prediction
**POST** `/api/predict-health-risk`

**Request Body:**
```json
{
  "symptoms": ["chest pain", "shortness of breath"],
  "age": 45,
  "gender": "male"
}
```

**Response:**
```json
{
  "riskLevel": "High",
  "potentialConditions": ["Possible Heart Disease", "Possible Respiratory Issue"],
  "recommendedSpecialist": "Cardiologist"
}
```

## 🎨 Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- CSS Custom Properties for theming
- Intersection Observer for animations
- Responsive design (mobile-first)

**Backend:**
- Node.js + Express.js
- CORS enabled
- RESTful API design
- Rule-based health assessment logic

## 🏥 Health Assessment Logic

The system uses rule-based logic to assess health risks:
- **Chest Pain**: High risk → Cardiologist
- **Shortness of Breath**: Medium risk → Pulmonologist 
- **Fever + Cough**: Medium risk → General Physician
- **Headache**: Low risk → Neurologist
- **Age Factor**: Risk increases for age > 50
- **Gender Considerations**: Specific rules for certain conditions

## 🔒 Security & Disclaimer

⚠️ **IMPORTANT**: This application is for educational/demonstration purposes only. The health risk assessments provided are NOT medical diagnoses and should not replace professional medical advice.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Ankush Khakale ([@Atharva2093](https://github.com/Atharva2093))
