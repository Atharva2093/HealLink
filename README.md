# HealLink

HealLink is a comprehensive healthcare platform that combines AI-powered disease prediction with secure patient portal functionality. It provides users with intelligent health risk assessments and secure access to medical services.

## 🚀 Features

### 🤖 AI Health Prediction
- **ML-Powered Disease Prediction**: Advanced ONNX model for accurate disease diagnosis
- **Intelligent Symptom Processing**: Fuzzy string matching and symptom correction
- **Risk Assessment**: Severity scoring with Low/Medium/High classifications
- **Confidence Scoring**: Transparent AI predictions with probability rankings
- **Medical Recommendations**: Evidence-based precautions and specialist suggestions

### 👤 Patient Portal
- **Secure Authentication**: Patient login and registration system
- **Personal Dashboard**: Centralized health management interface
- **Medical History**: Track and manage health records
- **Appointment Booking**: Schedule consultations with healthcare providers

### 🎨 User Experience
- **Responsive Design**: Mobile-first, modern interface
- **Real-time Processing**: Instant health assessments
- **Professional UI/UX**: Clean, medical-focused design with smooth animations

## 🏗️ Project Structure

```
HealLink/
├── public/
│   ├── index.html          # Main frontend page
│   ├── style.css           # Responsive styling
│   └── script.js           # Frontend interactions
├── views/
│   ├── login.html          # Patient authentication
│   └── portal.html         # Patient dashboard
├── mlmodel/
│   ├── api.py              # FastAPI ML server
│   ├── heallink_model.onnx # Trained ONNX model
│   ├── symptom_encoder.pkl # Feature encoders
│   ├── disease_encoder.pkl
│   └── data/               # Medical datasets
├── server.js               # Node.js backend server
├── package.json            # Dependencies
├── requirements.txt        # Python ML dependencies
├── LICENSE                 # MIT License
└── README.md              # This file
```
## ⚡ Quick Start

### Prerequisites
- Node.js (v14 or higher) 
- Python (3.8+) for ML model

### 1. Install Dependencies
```bash
# Node.js backend dependencies
npm install

# Python ML dependencies  
pip install -r requirements.txt
```

### 2. Start the Services
```bash
# Start Patient Portal Server
npm start

# Start ML Model API (in separate terminal)
cd mlmodel && python api.py

# Serve Frontend (in separate terminal)
python -m http.server 3000
```

### 3. Access the Application
- **Main Interface**: `http://localhost:3000/public/`
- **Patient Portal**: `http://localhost:3000/login`
- **ML API**: `http://localhost:8001/predict`

## 🔧 API Endpoints

### 🤖 ML Disease Prediction
**POST** `/predict`

**Request:**
```json
{
  "symptoms": ["fever", "cough", "headache"]
}
```

**Response:**
```json
{
  "Predicted Disease": "common cold",
  "Risk Level": "Low",
  "Confidence": 0.92,
  "Severity Score": 4,
  "Description": "Common viral infection...",
  "Precautions": ["Rest", "Stay hydrated", "Monitor temperature"],
  "Top_3": [["common cold", 0.92], ["flu", 0.06], ["pneumonia", 0.02]]
}
```

### 👤 Patient Authentication
**POST** `/login` - User authentication
**POST** `/register` - New patient registration

## 🎨 Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Responsive design (mobile-first)
- Modern UI/UX with animations

**Backend Services:**
- **Node.js + Express.js**: Patient portal and authentication
- **FastAPI + Python**: ML model serving
- **ONNX Runtime**: High-performance ML inference

**Machine Learning:**
- **ONNX Model**: Trained disease prediction model
- **Scikit-learn**: Feature preprocessing
- **FuzzyWuzzy**: Intelligent symptom matching
- **Medical Datasets**: 40+ diseases, 130+ symptoms

## 🏥 AI Health Assessment

The ML model provides:
- **Disease Prediction**: 40+ medical conditions
- **Confidence Scoring**: Probability-based predictions
- **Risk Stratification**: Low/Medium/High severity levels
- **Symptom Intelligence**: Natural language processing
- **Medical Guidance**: Evidence-based recommendations

## 🔒 Security & Disclaimer

⚠️ **IMPORTANT**: This application is for educational/demonstration purposes only. The AI predictions and health assessments are NOT medical diagnoses and should not replace professional medical advice.

**Security Features:**
- Secure patient authentication
- Encrypted data transmission
- Privacy-compliant design

## 📦 Installation & Development

### Local Development Setup
1. **Clone Repository**:
   ```bash
   git clone https://github.com/Atharva2093/HealLink.git
   cd HealLink
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Development Servers**:
   ```bash
   # Patient Portal (Port 3000)
   npm run dev
   
   # ML API (Port 8001)
   cd mlmodel && python api.py
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- Ankush Khakale ([@Atharva2093](https://github.com/Atharva2093))
- HealLink Development Team

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Atharva2093/HealLink/issues)
- **Email**: support@heallink.com
- **Documentation**: [Project Wiki](https://github.com/Atharva2093/HealLink/wiki)
