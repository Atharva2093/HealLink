// ================================
// CATEGORY-SPECIFIC SAFETY LAYER
// ================================

// Symptom normalization map for better matching
const NORMALIZATION_MAP = {
    // BREATHING EMERGENCIES
    "difficulty breathing": "breathlessness",
    "severe shortness of breath": "breathlessness",
    "breathing difficulty": "breathlessness",
    "can't breathe": "breathlessness",
    "cannot breathe": "breathlessness",
    "chest tightness": "chest_pain",
    "tight chest": "chest_pain",
    "can't catch breath": "breathlessness",
    "gasping": "breathlessness",
    "breathless": "breathlessness",
    "severe breathing problems": "breathlessness",
    "hard to breathe": "breathlessness",
    "trouble breathing": "breathlessness",
    "shortness of breath": "breathlessness",
    
    // THROAT SYMPTOMS (ENT) - NEVER MAP TO GI
    "pain in throat": "throat_irritation",
    "throat pain": "throat_irritation",
    "throught": "throat_irritation",
    "sore throat": "throat_irritation",
    "throat hurting": "throat_irritation",
    "throat ache": "throat_irritation",
    "painful throat": "throat_irritation",
    
    // CHEST SYMPTOMS
    "chest pressure": "chest_pain",
    "chest discomfort": "chest_pain",
    
    // COMMON SYMPTOMS
    "head pain": "headache",
    "body pain": "muscle_pain",
    "stomach ache": "stomach_pain",
    "belly pain": "stomach_pain",
    "runny nose": "runny_nose",
    "stuffy nose": "congestion"
};

// Emergency breathing detection keywords
const BREATHING_EMERGENCY_KEYWORDS = [
    "breath", "breathing", "gasp", "choking", "suffocating", 
    "can't breathe", "unable to breathe", "breathless", 
    "shortness", "chest tightness", "chest tight"
];

// Emergency throat keywords
const THROAT_EMERGENCY_KEYWORDS = [
    "unable to swallow", "cannot swallow", "drooling", 
    "muffled voice", "severe throat pain", "throat swelling"
];

// ================================
// MASTER MEDICAL ACCURACY SYSTEM
// ================================

/**
 * Applies comprehensive medical accuracy and safety rules
 * This system ensures medically correct predictions even if ML model makes mistakes
 */
function applyMedicalAccuracySystem(symptoms, age, gender, userCategory) {
    const processedSymptoms = symptoms.map(s => normalizeSymptom(s));
    const symptomStr = processedSymptoms.join(' ').toLowerCase();
    const rawStr = symptoms.join(' ').toLowerCase();
    
    // STEP 1: Detect Medical Category (Priority Order)
    const detectedCategory = detectMedicalCategory(processedSymptoms, rawStr);
    
    // STEP 2: Check for Emergency Conditions
    const emergencyStatus = checkEmergencyConditions(processedSymptoms, rawStr);
    
    // STEP 3: Calculate Accurate Severity Score
    const severityScore = calculateMedicalSeverity(processedSymptoms, rawStr, emergencyStatus);
    
    // STEP 4: Determine Risk Level
    const riskLevel = determineRiskLevel(severityScore, emergencyStatus);
    
    // STEP 5: Select Appropriate Specialist
    const specialist = selectSpecialist(detectedCategory, emergencyStatus);
    
    // STEP 6: Predict Most Likely Condition
    const condition = predictCondition(processedSymptoms, rawStr, detectedCategory);
    
    // STEP 7: Determine if Emergency
    const isEmergency = emergencyStatus.isEmergency;
    const emergencyReason = emergencyStatus.reasons.join(', ');
    
    // STEP 8: Get Precautions
    const precautions = getPrecautionsForCondition(condition, detectedCategory);
    
    // STEP 9: Category Override Logic
    let finalCategory = detectedCategory.primary;
    if (userCategory && validateCategoryMatch(userCategory, processedSymptoms, rawStr)) {
        finalCategory = userCategory;
    }
    
    return {
        condition,
        category: {
            primary: finalCategory,
            secondary: detectedCategory.secondary,
            detected: detectedCategory.primary
        },
        severity: severityScore,
        risk: riskLevel,
        emergency: {
            status: isEmergency,
            reason: emergencyReason
        },
        specialist,
        precautions,
        processedSymptoms,
        rawSymptoms: symptoms
    };
}

/**
 * CATEGORY DETECTION (Priority Order)
 */
function detectMedicalCategory(symptoms, rawStr) {
    const categories = {
        cardio: 0,
        respiratory: 0,
        neuro: 0,
        gi: 0,
        ent: 0,
        dermat: 0,
        allergy: 0,
        endocrine: 0,
        general: 0
    };
    
    // RESPIRATORY KEYWORDS
    const respiratoryKeywords = ['cough', 'cold', 'fever', 'sore throat', 'throat', 'runny nose', 'chest tightness', 'breathlessness', 'breathing'];
    respiratoryKeywords.forEach(kw => {
        if (rawStr.includes(kw)) categories.respiratory += 2;
    });
    
    // CARDIO KEYWORDS (HIGH PRIORITY)
    const cardioKeywords = ['chest pain', 'chest_pain', 'palpitations', 'heart'];
    cardioKeywords.forEach(kw => {
        if (rawStr.includes(kw)) categories.cardio += 5;
    });
    
    // ENT KEYWORDS
    const entKeywords = ['throat', 'sore throat', 'throat pain', 'throat irritation', 'ear', 'nose'];
    entKeywords.forEach(kw => {
        if (rawStr.includes(kw)) categories.ent += 3;
    });
    
    // NEURO KEYWORDS
    const neuroKeywords = ['headache', 'confusion', 'dizziness', 'weakness', 'numbness'];
    neuroKeywords.forEach(kw => {
        if (rawStr.includes(kw)) {
            categories.neuro += 2;
            // If headache + other neuro symptoms
            if (rawStr.includes('headache') && (rawStr.includes('confusion') || rawStr.includes('weakness'))) {
                categories.neuro += 3;
            }
        }
    });
    
    // GI KEYWORDS
    const giKeywords = ['abdominal pain', 'stomach', 'vomit', 'diarr', 'nausea', 'belly'];
    giKeywords.forEach(kw => {
        if (rawStr.includes(kw)) categories.gi += 2;
    });
    
    // DERMAT KEYWORDS
    const dermatKeywords = ['rash', 'itch', 'skin', 'lesion', 'bump'];
    dermatKeywords.forEach(kw => {
        if (rawStr.includes(kw)) categories.dermat += 2;
    });
    
    // ALLERGY KEYWORDS
    const allergyKeywords = ['sneez', 'itch', 'rash', 'hives'];
    let allergyScore = 0;
    allergyKeywords.forEach(kw => {
        if (rawStr.includes(kw)) allergyScore += 1;
    });
    
    // ALLERGY BLOCK RULE: Never predict allergy with these symptoms
    const allergyBlockers = ['chest pain', 'fever', 'chills', 'severe headache', 'breathless', 'nausea'];
    const hasBlocker = allergyBlockers.some(blocker => rawStr.includes(blocker));
    if (!hasBlocker && allergyScore > 2) {
        categories.allergy = allergyScore;
    }
    
    // Find primary and secondary categories
    const sorted = Object.entries(categories)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);
    
    const primary = sorted.length > 0 ? sorted[0][0] : 'general';
    const secondary = sorted.length > 1 ? sorted[1][0] : null;
    
    return { primary, secondary };
}

/**
 * EMERGENCY CONDITION CHECKER
 */
function checkEmergencyConditions(symptoms, rawStr) {
    const reasons = [];
    let isEmergency = false;
    
    // BREATHING EMERGENCIES
    if (rawStr.includes('severe') && (rawStr.includes('breath') || rawStr.includes('breathing'))) {
        reasons.push('Severe breathing difficulty');
        isEmergency = true;
    }
    if (rawStr.includes('can\'t breathe') || rawStr.includes('cannot breathe')) {
        reasons.push('Unable to breathe');
        isEmergency = true;
    }
    if (rawStr.includes('chest pain')) {
        reasons.push('Chest pain requires urgent evaluation');
        isEmergency = true;
    }
    if (rawStr.includes('chest tightness') && (rawStr.includes('breath') || rawStr.includes('breathless'))) {
        reasons.push('Chest tightness with breathing difficulty');
        isEmergency = true;
    }
    
    // NEURO EMERGENCIES
    if (rawStr.includes('confusion') || rawStr.includes('unable to speak')) {
        reasons.push('Neurological symptoms require immediate evaluation');
        isEmergency = true;
    }
    if (rawStr.includes('fainting') || rawStr.includes('loss of consciousness')) {
        reasons.push('Loss of consciousness');
        isEmergency = true;
    }
    if (rawStr.includes('one sided weakness') || rawStr.includes('paralysis')) {
        reasons.push('Possible stroke symptoms');
        isEmergency = true;
    }
    
    // THROAT EMERGENCIES
    if (rawStr.includes('unable to swallow') || rawStr.includes('drooling')) {
        reasons.push('Severe throat obstruction');
        isEmergency = true;
    }
    if (rawStr.includes('severe') && rawStr.includes('throat') && rawStr.includes('fever')) {
        reasons.push('Severe throat infection with fever');
        isEmergency = true;
    }
    
    // GI EMERGENCIES
    if (rawStr.includes('blood') && (rawStr.includes('vomit') || rawStr.includes('stool'))) {
        reasons.push('Gastrointestinal bleeding');
        isEmergency = true;
    }
    if (rawStr.includes('severe') && rawStr.includes('abdominal pain')) {
        reasons.push('Severe abdominal pain');
        isEmergency = true;
    }
    
    return { isEmergency, reasons };
}

/**
 * SEVERITY SCORING (0-20 scale)
 */
function calculateMedicalSeverity(symptoms, rawStr, emergencyStatus) {
    let score = 0;
    
    // EMERGENCY RED FLAGS: +4 to +5
    if (rawStr.includes('chest pain')) score += 5;
    if (rawStr.includes('severe') && rawStr.includes('breath')) score += 5;
    if (rawStr.includes('confusion')) score += 5;
    if (rawStr.includes('fainting')) score += 5;
    if (rawStr.includes('chest tightness')) score += 4;
    if (rawStr.includes('breathless') || rawStr.includes('breathlessness')) score += 4;
    
    // MODERATE SYMPTOMS: +2 to +3
    if (rawStr.includes('fever')) score += 3;
    if (rawStr.includes('vomit') || rawStr.includes('vomiting')) score += 3;
    if (rawStr.includes('dizziness')) score += 2;
    if (rawStr.includes('severe headache')) score += 3;
    if (rawStr.includes('headache')) score += 2;
    
    // MILD SYMPTOMS: +1
    if (rawStr.includes('cough')) score += 1;
    if (rawStr.includes('runny nose')) score += 1;
    if (rawStr.includes('fatigue')) score += 1;
    if (rawStr.includes('sore throat') && !rawStr.includes('severe')) score += 1;
    
    // THROAT SPECIFIC SCORING
    if ((rawStr.includes('throat') || rawStr.includes('sore throat')) && !rawStr.includes('severe')) {
        // Simple sore throat should be 4-7 severity
        score = Math.max(score, 4);
        score = Math.min(score, 7);
    }
    
    // CAP SEVERITY AT 20
    return Math.min(score, 20);
}

/**
 * RISK LEVEL DETERMINATION
 */
function determineRiskLevel(severity, emergencyStatus) {
    if (emergencyStatus.isEmergency || severity >= 15) return 'HIGH';
    if (severity >= 8) return 'MEDIUM';
    return 'LOW';
}

/**
 * SPECIALIST SELECTION
 */
function selectSpecialist(category, emergencyStatus) {
    if (emergencyStatus.isEmergency) return 'Emergency Medicine Specialist';
    
    const specialistMap = {
        cardio: 'Cardiologist',
        respiratory: 'Pulmonologist',
        neuro: 'Neurologist',
        gi: 'Gastroenterologist',
        dermat: 'Dermatologist',
        allergy: 'Allergist',
        endocrine: 'Endocrinologist',
        ent: 'ENT Specialist (Otolaryngologist)',
        general: 'General Physician'
    };
    
    return specialistMap[category.primary] || 'General Physician';
}

/**
 * CONDITION PREDICTION
 */
function predictCondition(symptoms, rawStr, category) {
    // THROAT CONDITIONS
    if (rawStr.includes('throat') || rawStr.includes('sore throat')) {
        if (rawStr.includes('fever')) return 'Acute Pharyngitis (Throat Infection)';
        return 'Sore Throat / Throat Irritation';
    }
    
    // RESPIRATORY CONDITIONS
    if (rawStr.includes('cough') && rawStr.includes('cold') && rawStr.includes('fever')) {
        return 'Common Cold / Viral Infection';
    }
    if (rawStr.includes('cough') && rawStr.includes('fever')) {
        return 'Respiratory Infection';
    }
    if (rawStr.includes('cough') && rawStr.includes('chest')) {
        return 'Bronchitis / Respiratory Infection';
    }
    
    // BREATHING EMERGENCIES
    if (rawStr.includes('chest pain') || rawStr.includes('chest tightness')) {
        if (rawStr.includes('breath')) return 'Acute Cardiopulmonary Event';
        return 'Cardiac Assessment Required';
    }
    if (rawStr.includes('severe') && rawStr.includes('breath')) {
        return 'Acute Respiratory Distress';
    }
    
    // HEADACHE CONDITIONS
    if (rawStr.includes('headache') && rawStr.includes('fever')) {
        return 'Viral Fever / Flu';
    }
    if (rawStr.includes('severe headache')) {
        return 'Severe Headache / Possible Migraine';
    }
    
    // SKIN CONDITIONS
    if (rawStr.includes('rash') && rawStr.includes('itch')) {
        return 'Allergic Reaction / Dermatitis';
    }
    
    // DEFAULT BY CATEGORY
    if (category.primary === 'respiratory') return 'Respiratory Condition';
    if (category.primary === 'gi') return 'Gastrointestinal Condition';
    if (category.primary === 'cardio') return 'Cardiovascular Concern';
    if (category.primary === 'neuro') return 'Neurological Concern';
    
    return 'General Medical Condition';
}

/**
 * PRECAUTIONS GENERATOR
 */
function getPrecautionsForCondition(condition, category) {
    const precautionMap = {
        'Sore Throat / Throat Irritation': [
            'Stay hydrated with warm fluids',
            'Gargle with warm salt water',
            'Rest your voice',
            'Avoid irritants like smoke'
        ],
        'Common Cold / Viral Infection': [
            'Get adequate rest',
            'Stay hydrated',
            'Use over-the-counter pain relievers if needed',
            'Practice good hand hygiene'
        ],
        'Acute Respiratory Distress': [
            'Seek immediate emergency care',
            'Sit upright to ease breathing',
            'Stay calm',
            'Do not delay medical attention'
        ],
        'Cardiac Assessment Required': [
            'Seek emergency medical evaluation immediately',
            'Do not exert yourself',
            'Sit or lie down',
            'Call emergency services if symptoms worsen'
        ]
    };
    
    if (precautionMap[condition]) return precautionMap[condition];
    
    // DEFAULT PRECAUTIONS
    return [
        'Monitor your symptoms closely',
        'Stay hydrated and get adequate rest',
        'Consult a healthcare provider if symptoms worsen',
        'Seek immediate care for severe or worsening symptoms'
    ];
}

/**
 * VALIDATE CATEGORY MATCH
 */
function validateCategoryMatch(userCategory, symptoms, rawStr) {
    // Don't allow allergy category if blockers present
    if (userCategory === 'allergy') {
        const blockers = ['chest pain', 'fever', 'breathless'];
        if (blockers.some(b => rawStr.includes(b))) return false;
    }
    return true;
}

// Symptom dictionaries (conservative medical categories)
const CATEGORY_SYMPTOMS = {
    cardio: {
        core: [
            "chest_pain",
            "chest tightness",
            "palpitations",
            "shortness_of_breath",
            "shortness of breath",
            "radiating_pain_arm",
            "radiating_pain_jaw",
            "swelling_legs",
            "fainting",
            "syncope",
            "heart_palpitations"
        ],
        redFlags: [
            "severe_chest_pain",
            "crushing_chest_pain",
            "chest_pain_exertion",
            "shortness_of_breath_rest",
            "sweating_with_chest_pain",
            "chest pain",
            "severe chest pain"
        ]
    },

    neuro: {
        core: [
            "headache",
            "severe_headache",
            "dizziness",
            "confusion",
            "blurred_vision",
            "numbness",
            "weakness",
            "speech_difficulty",
            "seizure",
            "migraine"
        ],
        redFlags: [
            "sudden_severe_headache",
            "loss_of_consciousness",
            "one_sided_weakness",
            "one_sided_numbness",
            "inability_to_speak",
            "seizure",
            "confusion_acute",
            "severe headache"
        ]
    },

    respiratory: {
        core: [
            "cough",
            "dry_cough",
            "productive_cough",
            "shortness_of_breath",
            "shortness of breath",
            "wheezing",
            "chest_tightness",
            "chest tightness",
            "sore_throat",
            "runny_nose",
            "throat_irritation",
            "continuous_sneezing",
            "difficulty_breathing",
            "breathing_difficulty",
            "breathless",
            "gasping"
        ],
        redFlags: [
            "shortness_of_breath_rest",
            "severe shortness of breath",
            "difficulty_breathing",
            "severe_breathing_difficulty",
            "unable_to_speak_full_sentences",
            "blue_lips",
            "stridor",
            "can't breathe",
            "suffocating",
            "gasping_for_air",
            "severe chest tightness",
            "difficulty breathing",
            "breathing difficulty"
        ]
    },

    gi: {
        core: [
            "stomach_pain",
            "abdominal_pain",
            "nausea",
            "vomiting",
            "diarrhoea",
            "diarrhea",
            "heartburn",
            "bloating",
            "acidity"
        ],
        redFlags: [
            "severe_abdominal_pain",
            "blood_in_vomit",
            "blood_in_stool",
            "black_stool",
            "persistent_vomiting",
            "severe stomach pain"
        ]
    }
};

// Category analysis function with enhanced matching
function analyzeCategories(normalizedSymptoms) {
    const scores = {
        cardio: 0,
        neuro: 0,
        respiratory: 0,
        gi: 0
    };

    const redFlagHits = {
        cardio: false,
        neuro: false,
        respiratory: false,
        gi: false
    };

    for (const s of normalizedSymptoms) {
        const symptom = normalizeSymptom(s).toLowerCase().trim().replace(/_/g, ' ');
        
        for (const [cat, def] of Object.entries(CATEGORY_SYMPTOMS)) {
            // Check core symptoms with enhanced matching
            if (def.core.some(core => {
                const coreClean = core.toLowerCase().replace(/_/g, ' ');
                return symptom.includes(coreClean) || coreClean.includes(symptom) ||
                       symptom === coreClean ||
                       (coreClean.includes(' ') && coreClean.split(' ').some(part => symptom.includes(part) && part.length > 3));
            })) {
                scores[cat] += 1; // basic weight
            }
            
            // Check red flags with enhanced matching
            if (def.redFlags.some(flag => {
                const flagClean = flag.toLowerCase().replace(/_/g, ' ');
                return symptom.includes(flagClean) || flagClean.includes(symptom) ||
                       symptom === flagClean ||
                       // Special emergency keywords that should trigger alerts
                       (symptom.includes('chest') && symptom.includes('pain')) ||
                       (symptom.includes('shortness') && symptom.includes('breath')) ||
                       (symptom.includes('difficulty') && symptom.includes('breathing')) ||
                       (symptom.includes('severe') && symptom.includes('headache')) ||
                       (symptom.includes('confusion'));
            })) {
                scores[cat] += 3; // strong boost
                redFlagHits[cat] = true;
            }
        }
    }

    // Category prioritization - respiratory takes priority for multi-symptom cases
    if (scores.respiratory >= 2) {
        // If we have multiple respiratory symptoms, prioritize respiratory category
        for (const [cat, score] of Object.entries(scores)) {
            if (cat !== 'respiratory' && score === scores.respiratory) {
                scores.respiratory += 1; // Give slight boost to respiratory
            }
        }
    }

    // Determine dominant category
    let dominantCategory = null;
    let maxScore = 0;
    for (const [cat, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            dominantCategory = score > 0 ? cat : null;
        }
    }

    return {
        scores,
        redFlagHits,
        dominantCategory,
        hasAnyRedFlag: Object.values(redFlagHits).some(v => v)
    };
}

// Rule-based safety layer with emergency detection
function applyRuleBasedLayer(normalizedSymptoms, mlResult) {
    const rawSymptoms = mlResult["Input Symptoms"] || normalizedSymptoms;
    const categoryAnalysis = analyzeCategories(normalizedSymptoms);

    let finalRiskLevel = mlResult["Risk Level"] || "Low";
    let finalSeverity = mlResult["Severity Score"] || 0;
    let flags = [];
    let triageAction = "monitor_and_consult";
    let emergencyAlert = false;

    // CRITICAL: Auto-detect breathing emergencies (even if ML fails to process)
    if (autoDetectBreathingEmergency(rawSymptoms)) {
        finalRiskLevel = "High";
        finalSeverity = Math.max(finalSeverity, 18);
        triageAction = "urgent_medical_evaluation";
        emergencyAlert = true;
        flags.push("⚠️ BREATHING EMERGENCY DETECTED - Immediate medical attention required");
        // Force respiratory category for breathing emergencies
        categoryAnalysis.dominantCategory = "respiratory";
        categoryAnalysis.redFlagHits.respiratory = true;
        categoryAnalysis.hasAnyRedFlag = true;
    }

    // 1) Emergency override based on red flags
    if (categoryAnalysis.hasAnyRedFlag) {
        finalRiskLevel = "High";
        finalSeverity = Math.max(finalSeverity, 17); // push near upper bound
        triageAction = "urgent_medical_evaluation";
        emergencyAlert = true;

        if (categoryAnalysis.redFlagHits.cardio) {
            flags.push("⚠️ Possible cardiac emergency symptoms detected");
        }
        if (categoryAnalysis.redFlagHits.neuro) {
            flags.push("⚠️ Possible neurological emergency symptoms detected");
        }
        if (categoryAnalysis.redFlagHits.respiratory) {
            flags.push("⚠️ Possible respiratory emergency symptoms detected");
        }
        if (categoryAnalysis.redFlagHits.gi) {
            flags.push("⚠️ Possible gastrointestinal emergency symptoms detected");
        }
    }

    // 2) Category mismatch correction
    if (!categoryAnalysis.hasAnyRedFlag && categoryAnalysis.dominantCategory) {
        const confidence = mlResult["Confidence"] || 0;
        
        // If ML confidence is low, trust category-based risk more
        if (confidence < 0.25) {
            if (["cardio", "neuro", "respiratory"].includes(categoryAnalysis.dominantCategory)) {
                if (finalRiskLevel === "Low") finalRiskLevel = "Medium";
                if (finalRiskLevel === "Medium") finalRiskLevel = "High";
                finalSeverity = Math.max(finalSeverity, 13);
                flags.push(`🔍 Risk adjusted based on ${categoryAnalysis.dominantCategory} symptoms`);
            }
        }

        // Add category-specific guidance
        const categoryMap = {
            cardio: "Consider consulting a cardiologist",
            neuro: "Consider consulting a neurologist", 
            respiratory: "Consider consulting a pulmonologist",
            gi: "Consider consulting a gastroenterologist"
        };
        
        if (categoryMap[categoryAnalysis.dominantCategory]) {
            flags.push(`💡 ${categoryMap[categoryAnalysis.dominantCategory]}`);
        }
    }

    // 3) Vague symptom adjustment
    if (normalizedSymptoms.length <= 2 && !categoryAnalysis.hasAnyRedFlag && !emergencyAlert) {
        const vagueSymptoms = ['fatigue', 'malaise', 'tired', 'weakness', 'general pain'];
        const isVague = normalizedSymptoms.every(s => 
            vagueSymptoms.some(vague => s.toLowerCase().includes(vague))
        );
        
        if (isVague) {
            finalRiskLevel = "Low";
            finalSeverity = Math.min(finalSeverity, 8);
            flags.push("ℹ️ Vague symptoms - comprehensive medical evaluation recommended");
            triageAction = "general_checkup_recommended";
        } else {
            flags.push("ℹ️ Limited symptoms provided - consider comprehensive evaluation");
            const confidence = mlResult["Confidence"] || 0;
            if (confidence < 0.2) {
                triageAction = "general_checkup_recommended";
            }
        }
    }

    // 4) Low confidence warning
    if ((mlResult["Confidence"] || 0) < 0.15) {
        flags.push("⚠️ Low prediction confidence - seek professional medical advice");
    }

    return {
        ...mlResult,
        categoryAnalysis,
        "Risk Level": finalRiskLevel,
        "Severity Score": Math.min(finalSeverity, 20), // ensure cap at 20
        safetyFlags: flags,
        triageAction,
        emergencyAlert
    };
}

// ================================
//      MAIN SCRIPT FUNCTIONS  
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Header Scroll Effect
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header
                const headerHeight = document.querySelector('.header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Health Prediction with ML Model Integration
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', predictDisease);
    }
});

// Enhanced Health Prediction with ML Integration
const analyzeBtn = document.getElementById('analyzeBtn');
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', predictDisease);

    // Auto-resize textareas and enhance UX
    const symptomsInput = document.getElementById('symptomsInput');
    if (symptomsInput) {
        symptomsInput.addEventListener('input', function() {
            // Clear previous results when input changes
            const resultBox = document.getElementById('resultBox');
            if (resultBox && resultBox.style.display === 'block') {
                resultBox.style.display = 'none';
            }
        });
    }
}

// ================================
// MEDICAL ACCURACY & SAFETY SYSTEM 
// ================================

// HIGH-RISK SYMPTOMS (immediate red flags)
const HIGH_RISK_SYMPTOMS = [
    "chest pain", "chest tightness", "difficulty breathing", "shortness of breath",
    "severe headache", "confusion", "weakness", "speech difficulty", "fainting",
    "severe abdominal pain", "black stool", "blood in vomit", "paralysis",
    "dizziness with chest pain", "can't breathe", "severe breathing problems"
];

// ALLERGY BLOCK RULES
const ALLERGY_BLOCKERS = [
    "chest pain", "fever", "chills", "severe headache", "shortness of breath",
    "nausea", "vomiting", "confusion", "weakness"
];

// CATEGORY DETECTION RULES (priority order)
const CATEGORY_RULES = {
    respiratory: ["cough", "cold", "fever", "sore throat", "runny nose", "chest tightness", "breathing", "shortness"],
    cardio: ["chest pain", "shortness of breath", "chest tightness", "heart", "palpitations"],
    neuro: ["headache", "confusion", "weakness", "dizziness", "speech", "paralysis"],
    gi: ["abdominal pain", "vomiting", "diarrhea", "stomach", "nausea"],
    dermat: ["rash", "itching", "skin", "spots"],
    endocrine: ["weight loss", "thirst", "hormonal", "diabetes"],
    psychiatry: ["mood", "anxiety", "hallucinations", "depression"],
    allergy: ["sneezing", "itching", "rash", "allergic"],
    general: [] // fallback
};

// MEDICAL ACCURACY & SAFETY SYSTEM
function applyMedicalAccuracySystem(symptoms, age, gender, category) {
    const result = {
        condition: "General Health Assessment",
        category: category || "general",
        severityScore: 0,
        riskLevel: "LOW",
        isEmergency: false,
        actionSteps: [],
        specialist: "General Physician",
        precautions: [],
        disclaimer: "This is an AI assessment. Please consult a healthcare professional for proper diagnosis."
    };
    
    // Step 1: Check for high-risk symptoms
    const hasHighRisk = symptoms.some(symptom => 
        HIGH_RISK_SYMPTOMS.some(risk => 
            symptom.toLowerCase().includes(risk.toLowerCase().split(' ')[0]) ||
            risk.toLowerCase().includes(symptom.toLowerCase())
        )
    );
    
    if (hasHighRisk) {
        result.severityScore += 8;
        result.riskLevel = "HIGH";
        result.isEmergency = true;
        result.actionSteps.push("🚨 SEEK IMMEDIATE MEDICAL ATTENTION");
        result.actionSteps.push("📞 Consider calling emergency services");
        result.category = detectEmergencyCategory(symptoms);
        result.specialist = getSpecialistForCategory(result.category);
    }
    
    // Step 2: Auto-detect category if not provided
    if (!category || category === "") {
        result.category = detectCategory(symptoms);
    }
    
    // Step 3: Apply allergy block rule
    if (result.category === "allergy") {
        const hasBlocker = symptoms.some(symptom =>
            ALLERGY_BLOCKERS.some(blocker =>
                symptom.toLowerCase().includes(blocker.toLowerCase().split(' ')[0])
            )
        );
        if (hasBlocker) {
            result.category = detectNonAllergyCategory(symptoms);
            result.condition = "Medical Condition (Not Allergy)";
        }
    }
    
    // Step 4: Calculate severity score
    calculateSeverityScore(result, symptoms, age, gender);
    
    // Step 5: Set appropriate actions
    setMedicalActions(result, symptoms);
    
    return result;
}

// Detect emergency category for high-risk symptoms
function detectEmergencyCategory(symptoms) {
    const symptomText = symptoms.join(" ").toLowerCase();
    
    if (symptomText.includes("chest") || symptomText.includes("heart") || symptomText.includes("breath")) {
        return "cardio";
    }
    if (symptomText.includes("headache") || symptomText.includes("confusion") || symptomText.includes("weakness")) {
        return "neuro";
    }
    if (symptomText.includes("breathing") || symptomText.includes("cough") || symptomText.includes("lung")) {
        return "respiratory";
    }
    if (symptomText.includes("abdominal") || symptomText.includes("stomach") || symptomText.includes("vomit")) {
        return "gi";
    }
    return "emergency";
}

// Detect category based on symptoms
function detectCategory(symptoms) {
    const symptomText = symptoms.join(" ").toLowerCase();
    const scores = {};
    
    // Score each category
    for (const [cat, keywords] of Object.entries(CATEGORY_RULES)) {
        scores[cat] = 0;
        keywords.forEach(keyword => {
            if (symptomText.includes(keyword.toLowerCase())) {
                scores[cat] += 1;
            }
        });
    }
    
    // Find highest scoring category
    const maxScore = Math.max(...Object.values(scores));
    const topCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
    
    return topCategory || "general";
}

// Detect non-allergy category when allergy is blocked
function detectNonAllergyCategory(symptoms) {
    const categories = ["respiratory", "cardio", "neuro", "gi", "dermat", "endocrine"];
    return detectCategoryFromList(symptoms, categories) || "general";
}

function detectCategoryFromList(symptoms, categories) {
    const symptomText = symptoms.join(" ").toLowerCase();
    
    for (const cat of categories) {
        const keywords = CATEGORY_RULES[cat] || [];
        if (keywords.some(keyword => symptomText.includes(keyword.toLowerCase()))) {
            return cat;
        }
    }
    return null;
}

// Calculate medical severity score (0-20)
function calculateSeverityScore(result, symptoms, age, gender) {
    let score = result.severityScore;
    
    // High-risk symptoms already add 8 points
    symptoms.forEach(symptom => {
        const s = symptom.toLowerCase();
        
        // Moderate symptoms add 2-3 points
        if (s.includes("vomit") || s.includes("fever") || s.includes("dizz") || s.includes("moderate")) {
            score += 2;
        }
        
        // Mild symptoms add 1 point
        if (s.includes("mild") || s.includes("slight") || s.includes("minor")) {
            score += 1;
        }
        
        // Pain intensity modifiers
        if (s.includes("severe")) score += 3;
        if (s.includes("intense")) score += 2;
        if (s.includes("sharp")) score += 2;
    });
    
    // Age factor
    const ageNum = parseInt(age) || 0;
    if (ageNum > 65 || ageNum < 5) {
        score += 2; // Higher risk for elderly and very young
    }
    
    // Cap at 20
    result.severityScore = Math.min(score, 20);
    
    // Update risk level based on score
    if (result.severityScore >= 15) {
        result.riskLevel = "HIGH";
    } else if (result.severityScore >= 8) {
        result.riskLevel = "MODERATE";
    } else {
        result.riskLevel = "LOW";
    }
}

// Set appropriate medical actions
function setMedicalActions(result, symptoms) {
    if (result.isEmergency) {
        result.actionSteps = [
            "🚨 URGENT MEDICAL EVALUATION REQUIRED",
            "📞 Call emergency services or go to ER immediately",
            "⚠️ Do not delay seeking medical care"
        ];
    } else if (result.riskLevel === "MODERATE") {
        result.actionSteps = [
            "📋 Schedule appointment with " + result.specialist,
            "📊 Monitor symptoms closely",
            "🩺 Seek medical evaluation within 24-48 hours"
        ];
    } else {
        result.actionSteps = [
            "📋 Consider consultation with " + result.specialist,
            "📊 Monitor symptoms and track changes",
            "💊 Rest and basic self-care as appropriate"
        ];
    }
    
    // Add category-specific precautions
    addCategoryPrecautions(result, symptoms);
}

// Add category-specific precautions
function addCategoryPrecautions(result, symptoms) {
    switch (result.category) {
        case "cardio":
            result.precautions.push("Avoid strenuous activity");
            result.precautions.push("Monitor blood pressure");
            break;
        case "respiratory":
            result.precautions.push("Rest and stay hydrated");
            result.precautions.push("Avoid irritants and smoke");
            break;
        case "neuro":
            result.precautions.push("Avoid driving if dizzy");
            result.precautions.push("Get adequate rest");
            break;
        case "gi":
            result.precautions.push("Stay hydrated");
            result.precautions.push("Eat light, bland foods");
            break;
        default:
            result.precautions.push("Rest and monitor symptoms");
            result.precautions.push("Stay hydrated");
    }
}

// Get specialist for category
function getSpecialistForCategory(category) {
    const specialists = {
        cardio: "Cardiologist",
        neuro: "Neurologist", 
        respiratory: "Pulmonologist",
        gi: "Gastroenterologist",
        dermat: "Dermatologist",
        allergy: "Allergist",
        endocrine: "Endocrinologist",
        psychiatry: "Psychiatrist",
        emergency: "Emergency Medicine Physician",
        general: "General Physician"
    };
    return specialists[category] || "General Physician";
}

// Correct ML model results using medical accuracy rules
function correctMLResult(mlData, safetyResult, symptoms, age, gender, category) {
    const correctedData = { ...mlData };
    
    // Override ML result if safety system detects emergency
    if (safetyResult.isEmergency) {
        correctedData["Risk Level"] = "HIGH";
        correctedData["Predicted Disease"] = safetyResult.condition;
        correctedData.emergencyAlert = true;
        correctedData.emergencyReason = "High-risk symptoms detected by safety system";
    }
    
    // Fix category misclassification
    if (safetyResult.category !== "general" && safetyResult.category !== "allergy") {
        correctedData.category = safetyResult.category;
    }
    
    // Apply allergy block rule
    if (mlData["Predicted Disease"]?.toLowerCase().includes("allergy") && 
        symptoms.some(s => ALLERGY_BLOCKERS.some(blocker => 
            s.toLowerCase().includes(blocker.toLowerCase())))) {
        correctedData["Predicted Disease"] = safetyResult.condition;
        correctedData.category = safetyResult.category;
        correctedData.allergyBlocked = true;
    }
    
    // Ensure severity matches safety assessment
    correctedData.severityScore = Math.max(
        correctedData.severityScore || 0, 
        safetyResult.severityScore
    );
    
    return correctedData;
}

// Display medical safety results when ML API fails
function displayMedicalSafetyResults(safetyResult, age, gender) {
    const resultBox = document.getElementById('resultBox');
    
    // Emergency styling
    const emergencyClass = safetyResult.isEmergency ? 'emergency-alert' : '';
    const emergencyIcon = safetyResult.isEmergency ? '🚨' : '🎯';
    const riskColor = getRiskColor(safetyResult.riskLevel);
    
    resultBox.innerHTML = `
        <div class="prediction-results ${emergencyClass}">
            <h3>${emergencyIcon} Medical Assessment Results</h3>
            
            <div class="result-summary">
                <div class="main-prediction">
                    <span class="disease-label">Assessment:</span>
                    <span class="disease-name">${safetyResult.condition}</span>
                </div>
                <div class="category-info">
                    <span class="category-label">Category:</span>
                    <span class="category-value">${getCategoryDisplayName(safetyResult.category)}</span>
                </div>
            </div>

            <div class="risk-assessment">
                <div class="risk-level" style="background-color: ${riskColor};">
                    <span class="risk-label">Risk Level:</span>
                    <span class="risk-value">${safetyResult.riskLevel}</span>
                </div>
                <div class="severity-score">
                    <span class="score-label">Severity Score:</span>
                    <span class="score-value">${safetyResult.severityScore}/20</span>
                </div>
            </div>

            ${safetyResult.isEmergency ? `
            <div class="emergency-alert-box">
                <h4>🚨 EMERGENCY MEDICAL SITUATION</h4>
                <p>Based on your symptoms, immediate medical attention is strongly recommended.</p>
                <button onclick="handleEmergencyAction()" class="emergency-action-btn">
                    Take Emergency Action
                </button>
            </div>
            ` : ''}

            <div class="medical-actions">
                <h4>📋 Recommended Actions:</h4>
                <ul>
                    ${safetyResult.actionSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>

            <div class="specialist-recommendation">
                <h4>👨‍⚕️ Recommended Specialist:</h4>
                <p>${safetyResult.specialist}</p>
            </div>

            <div class="precautions">
                <h4>⚠️ Precautions:</h4>
                <ul>
                    ${safetyResult.precautions.map(precaution => `<li>${precaution}</li>`).join('')}
                </ul>
            </div>

            <div class="medical-disclaimer">
                <p><strong>Medical Disclaimer:</strong> ${safetyResult.disclaimer}</p>
            </div>

            <div class="powered-by">
                <p>🔬 Powered by HealLink Medical Safety System</p>
            </div>
        </div>
    `;
    
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
    
    // Trigger emergency alert if needed
    if (safetyResult.isEmergency) {
        setTimeout(() => {
            handleEmergencyAction();
        }, 1000);
    }
}

// Get category display name
function getCategoryDisplayName(category) {
    const names = {
        cardio: "Cardiovascular",
        neuro: "Neurological", 
        respiratory: "Respiratory",
        gi: "Gastrointestinal",
        dermat: "Dermatological",
        allergy: "Allergic",
        endocrine: "Endocrine",
        psychiatry: "Psychiatric",
        emergency: "Emergency",
        general: "General Medicine"
    };
    return names[category] || "General";
}

// Get risk level color
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case "HIGH": return "#dc2626";
        case "MODERATE": return "#f59e0b"; 
        case "LOW": return "#16a34a";
        default: return "#6b7280";
    }
}

// Enhanced ML Model Disease Prediction Function
async function predictDisease() {
    const symptomsInput = document.getElementById('symptomsInput').value;
    const ageInput = document.getElementById('ageInput').value;
    const genderInput = document.getElementById('genderInput').value;
    const categoryInput = document.getElementById('category').value;
    const resultBox = document.getElementById('resultBox');

    // Enhanced validation
    if (!symptomsInput.trim()) {
        showAlert('Please enter at least one symptom.', 'warning');
        return;
    }

    // Show loading state with enhanced UI
    setLoadingState(true);

    try {
        // Prepare symptoms array with better processing
        const symptoms = symptomsInput.split(/[,;\\n]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (symptoms.length === 0) {
            throw new Error('Please enter valid symptoms.');
        }

        // Apply MEDICAL ACCURACY & SAFETY SYSTEM first
        const medicalSafetyResult = applyMedicalAccuracySystem(symptoms, ageInput, genderInput, categoryInput);
        
        // Try ML model API with safety override capability
        let mlSuccess = false;
        try {
            const response = await fetch("http://127.0.0.1:8001/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ symptoms })
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.error && data["Predicted Disease"] !== "None") {
                    const correctedResult = correctMLResult(data, medicalSafetyResult, symptoms, ageInput, genderInput, categoryInput);
                    displayMLResults(correctedResult, ageInput, genderInput);
                    mlSuccess = true;
                }
            }
        } catch (mlError) {
            // ML API unavailable, fallback to safety system
        }

        if (!mlSuccess) {
            displayMedicalSafetyResults(medicalSafetyResult, ageInput, genderInput);
        }

    } catch (error) {
        console.error('Prediction error:', error);
        displayErrorResult(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Enhanced loading state management
function setLoadingState(isLoading) {
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (isLoading) {
        analyzeBtn.textContent = '🔄 Analyzing...';
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = '0.7';
    } else {
        analyzeBtn.textContent = '🔬 Analyze Symptoms';
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
    }
}

// Display comprehensive ML model results
function displayMLResults(data, age, gender) {
    const resultBox = document.getElementById('resultBox');
    
    // Apply rule-based safety layer
    const enhancedData = applyRuleBasedLayer(data["Corrected Symptoms"] || [], data);
    
    const specialistRecommendation = getSpecialistForDisease(enhancedData["Predicted Disease"]);

    // Emergency alert styling
    const emergencyClass = enhancedData.emergencyAlert ? 'emergency-alert' : '';
    const emergencyIcon = enhancedData.emergencyAlert ? '🚨' : '🎯';

    resultBox.innerHTML = `
        <div class="result-header ${emergencyClass}">
            <h3>${emergencyIcon} AI Health Analysis Complete</h3>
            <div class="confidence-badge">Confidence: ${(enhancedData["Confidence"] * 100).toFixed(1)}%</div>
            ${enhancedData.emergencyAlert ? '<div class="emergency-badge">⚠️ URGENT EVALUATION RECOMMENDED</div>' : ''}
        </div>
        
        <div class="result-section">
            <h4>🔬 Primary Prediction</h4>
            <p><strong>Condition:</strong> ${enhancedData["Predicted Disease"]}</p>
            <p><strong>Risk Level:</strong> <span class="risk-${enhancedData["Risk Level"].toLowerCase()}">${enhancedData["Risk Level"]}</span></p>
            <p><strong>Severity Score:</strong> ${enhancedData["Severity Score"]}/20</p>
            ${enhancedData.triageAction ? `<p><strong>Recommended Action:</strong> ${enhancedData.triageAction.replace(/_/g, ' ').toUpperCase()}</p>` : ''}
        </div>

        ${enhancedData.safetyFlags && enhancedData.safetyFlags.length > 0 ? `
        <div class="result-section safety-flags">
            <h4>🛡️ Safety Assessment</h4>
            <ul class="safety-flags-list">
                ${enhancedData.safetyFlags.map(flag => `<li>${flag}</li>`).join("")}
            </ul>
        </div>` : ''}

        <div class="result-section">
            <h4>📖 Medical Information</h4>
            <div class="description-text">
                ${enhancedData["Description"]}
            </div>
        </div>

        <div class="result-section">
            <h4>⚕️ Recommended Specialist</h4>
            <div class="specialist-info">
                <strong>${specialistRecommendation}</strong>
                <p>Based on your predicted condition</p>
            </div>
        </div>

        <div class="result-section">
            <h4>🛡️ Recommended Precautions</h4>
            <ul class="precautions-list">
                ${enhancedData["Precautions"].map(p => `<li>${p}</li>`).join("")}
            </ul>
        </div>

        <div class="result-section">
            <h4>🔍 Symptom Analysis</h4>
            <div class="symptom-analysis">
                <p><strong>Your Input:</strong> ${enhancedData["Input Symptoms"].join(", ")}</p>
                <p><strong>AI Processed:</strong> ${enhancedData["Corrected Symptoms"].join(", ")}</p>
                ${enhancedData.categoryAnalysis && enhancedData.categoryAnalysis.dominantCategory ? 
                    `<p><strong>Primary Category:</strong> ${enhancedData.categoryAnalysis.dominantCategory.toUpperCase()}</p>` : ''}
            </div>
        </div>

        <div class="result-section">
            <h4>📊 Alternative Possibilities</h4>
            <div class="alternatives-list">
                ${enhancedData["Top_3"].map((item, index) => 
                    `<div class="alternative-item ${index === 0 ? 'primary' : ''}">
                        <span class="condition">${item[0]}</span>
                        <span class="probability">${(item[1] * 100).toFixed(1)}%</span>
                    </div>`
                ).join("")}
            </div>
        </div>

        <div class="result-actions">
            ${enhancedData.emergencyAlert ? 
                '<button onclick="handleEmergencyAction()" class="btn-emergency">🚨 Seek Immediate Medical Attention</button>' :
                '<button onclick="bookAppointment(\''+specialistRecommendation+'\')" class="btn-primary">Book Appointment</button>'
            }
            <button onclick="generateHealthReport()" class="btn-outline">Download Report</button>
        </div>

        <div class="disclaimer">
            <h4>⚠️ Important Medical Disclaimer</h4>
            <p><strong>This is an AI-based risk estimate, not a medical diagnosis.</strong> This analysis is for informational purposes only and should never replace professional medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment. In case of emergency symptoms, contact your local emergency services immediately.</p>
            ${enhancedData.emergencyAlert ? '<p class="emergency-text"><strong>🚨 EMERGENCY ALERT: The symptoms you\'ve reported may indicate a serious medical condition requiring immediate attention. Please seek emergency medical care without delay.</strong></p>' : ''}
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Add animation
    setTimeout(() => {
        resultBox.classList.add('result-visible');
    }, 100);
}

// Enhanced rule-based prediction fallback
async function enhancedRuleBasedPrediction(symptoms, age, gender) {
    const riskFactors = calculateRiskFactors(symptoms, age, gender);
    const prediction = generateRuleBasedPrediction(riskFactors);
    
    displayFallbackResults(prediction);
}

// Calculate enhanced risk factors
function calculateRiskFactors(symptoms, age, gender) {
    const riskMap = {
        'chest pain': { risk: 'High', specialty: 'Cardiologist', severity: 8 },
        'shortness of breath': { risk: 'High', specialty: 'Pulmonologist', severity: 7 },
        'severe headache': { risk: 'Medium', specialty: 'Neurologist', severity: 6 },
        'fever': { risk: 'Medium', specialty: 'General Physician', severity: 5 },
        'cough': { risk: 'Low', specialty: 'General Physician', severity: 3 },
        'fatigue': { risk: 'Low', specialty: 'General Physician', severity: 2 }
    };

    let maxRisk = 'Low';
    let specialist = 'General Physician';
    let totalSeverity = 0;
    let conditions = [];

    symptoms.forEach(symptom => {
        const lowerSymptom = symptom.toLowerCase().trim();
        for (const [key, value] of Object.entries(riskMap)) {
            if (lowerSymptom.includes(key)) {
                totalSeverity += value.severity;
                if (value.risk === 'High' || (value.risk === 'Medium' && maxRisk === 'Low')) {
                    maxRisk = value.risk;
                    specialist = value.specialty;
                }
                conditions.push(`Possible ${key.charAt(0).toUpperCase() + key.slice(1)} related condition`);
            }
        }
    });

    // Age factor
    if (age && parseInt(age) > 60) {
        totalSeverity += 2;
        if (maxRisk === 'Low') maxRisk = 'Medium';
    }

    return {
        riskLevel: totalSeverity > 10 ? 'High' : totalSeverity > 5 ? 'Medium' : 'Low',
        specialist,
        conditions: conditions.length > 0 ? conditions : ['General health assessment needed'],
        severity: totalSeverity
    };
}

// Generate rule-based prediction
function generateRuleBasedPrediction(riskFactors) {
    return {
        riskLevel: riskFactors.riskLevel,
        potentialConditions: riskFactors.conditions,
        recommendedSpecialist: riskFactors.specialist,
        severityScore: riskFactors.severity,
        confidence: 0.75 // Rule-based confidence
    };
}

// Display enhanced fallback results
function displayFallbackResults(data) {
    const resultBox = document.getElementById('resultBox');
    
    resultBox.innerHTML = `
        <div class="result-header fallback">
            <h3>📋 Health Assessment Results</h3>
            <div class="system-badge">Rule-Based Analysis</div>
        </div>
        
        <div class="result-section">
            <h4>📈 Assessment Summary</h4>
            <p><strong>Risk Level:</strong> <span class="risk-${data.riskLevel.toLowerCase()}">${data.riskLevel}</span></p>
            <p><strong>Severity Score:</strong> ${data.severityScore}/20</p>
            <p><strong>Analysis Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
        </div>

        <div class="result-section">
            <h4>🏥 Possible Conditions</h4>
            <ul class="conditions-list">
                ${data.potentialConditions.map(condition => `<li>${condition}</li>`).join('')}
            </ul>
        </div>

        <div class="result-section">
            <h4>⚕️ Recommended Specialist</h4>
            <div class="specialist-info">
                <strong>${data.recommendedSpecialist}</strong>
                <p>Based on your symptoms</p>
            </div>
        </div>

        <div class="result-actions">
            <button onclick="bookAppointment('${data.recommendedSpecialist}')" class="btn-primary">Book Appointment</button>
            <button onclick="checkMLServiceAndRetry()" class="btn-outline">🔄 Check ML Service</button>
        </div>
        
        <div class="system-note">
            <p>💡 <strong>Note:</strong> Advanced ML analysis unavailable. Using rule-based assessment. Click "Check ML Service" to retry with full AI analysis.</p>
        </div>
        
        <div class="disclaimer">
            <h4>⚠️ Medical Disclaimer</h4>
            <p>This assessment is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice.</p>
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
        resultBox.classList.add('result-visible');
    }, 100);
}

// Display error when services are unavailable
function displayErrorResult(errorMessage) {
    const resultBox = document.getElementById('resultBox');
    
    resultBox.innerHTML = `
        <div class="result-header error">
            <h3>⚠️ Service Error</h3>
        </div>
        
        <div class="error-content">
            <div class="error-icon">🔧</div>
            <h4>Service Temporarily Unavailable</h4>
            <p><strong>Error:</strong> ${errorMessage}</p>
            
            <div class="error-solutions">
                <h5>Possible Solutions:</h5>
                <ul>
                    <li>Check your internet connection</li>
                    <li>Try again in a few moments</li>
                    <li>Contact support if the problem persists</li>
                </ul>
            </div>
            
            <div class="result-actions">
                <button onclick="predictDisease()" class="btn-primary">🔄 Try Again</button>
                <button onclick="contactSupport()" class="btn-outline">📞 Contact Support</button>
            </div>
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

// Utility functions for enhanced UX
function showAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.remove();
    }, 5000);
}

// Enhanced appointment booking
function bookAppointment(specialist) {
    showAlert(`Redirecting to book appointment with ${specialist}...`, 'info');
    setTimeout(() => {
        window.location.href = 'views/login.html';
    }, 1500);
}

// Generate health report
function generateHealthReport() {
    const resultData = document.getElementById('resultBox').innerHTML;
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
            <head>
                <title>HealLink Health Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .result-section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; background: #f9f9f9; }
                    .disclaimer { background: #fff3cd; padding: 15px; border: 1px solid #ffc107; border-radius: 5px; }
                    .risk-high { color: #e74c3c; font-weight: bold; }
                    .risk-medium { color: #f39c12; font-weight: bold; }
                    .risk-low { color: #27ae60; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>🏥 HealLink Health Assessment Report</h1>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                ${resultData}
                <hr>
                <footer>
                    <p><small>This report is for informational purposes only. Always consult with a healthcare professional.</small></p>
                </footer>
            </body>
        </html>
    `);
    reportWindow.document.close();
}

// Check ML service status and retry analysis
function checkMLServiceAndRetry() {
    const symptomsInput = document.getElementById('symptomsInput').value;
    if (!symptomsInput.trim()) {
        showAlert('Please enter symptoms first.', 'warning');
        return;
    }

    // Test ML service connection
    fetch("http://127.0.0.1:8001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: ["test"] })
    })
    .then(response => {
        if (response.ok) {
            showAlert('✅ ML service is now available! Running advanced analysis...', 'success');
            setTimeout(() => predictDisease(), 1000);
        } else {
            showAlert('❌ ML service still unavailable. Please start the service first.', 'error');
        }
    })
    .catch(() => {
        showAlert('❌ ML service unavailable. Please ensure it\'s running on port 8001.', 'error');
    });
}

// Contact support
function contactSupport() {
    showAlert('Redirecting to support...', 'info');
    setTimeout(() => {
        window.open('mailto:support@heallink.com?subject=Technical Support Request', '_blank');
    }, 1000);
}

// Helper function to get specialist based on disease
function getSpecialistForDisease(disease) {
    const diseaseSpecialistMap = {
        // Heart related
        'heart attack': 'Cardiologist',
        'hypertension': 'Cardiologist', 
        'heart disease': 'Cardiologist',
        
        // Respiratory
        'pneumonia': 'Pulmonologist',
        'bronchial asthma': 'Pulmonologist',
        'tuberculosis': 'Pulmonologist',
        
        // Digestive
        'gastroesophageal reflux disease': 'Gastroenterologist',
        'peptic ulcer diseae': 'Gastroenterologist',
        'gastroenteritis': 'Gastroenterologist',
        
        // Neurological  
        'migraine': 'Neurologist',
        'cervical spondylosis': 'Neurologist',
        'paralysis (brain hemorrhage)': 'Neurologist',
        
        // Infectious
        'malaria': 'Infectious Disease Specialist',
        'typhoid': 'Infectious Disease Specialist',
        'hepatitis a': 'Hepatologist',
        'hepatitis b': 'Hepatologist',
        'hepatitis c': 'Hepatologist',
        'hepatitis d': 'Hepatologist',
        'hepatitis e': 'Hepatologist',
        'alcoholic hepatitis': 'Hepatologist',
        
        // Skin related
        'fungal infection': 'Dermatologist',
        'allergy': 'Allergist',
        'psoriasis': 'Dermatologist',
        'impetigo': 'Dermatologist',
        
        // Endocrine
        'diabetes': 'Endocrinologist',
        'hyperthyroidism': 'Endocrinologist',
        'hypothyroidism': 'Endocrinologist',
        
        // Arthritis related
        'arthritis': 'Rheumatologist',
        'osteoarthristis': 'Orthopedist',
        
        // Urological
        'urinary tract infection': 'Urologist',
        
        // Others
        'jaundice': 'Hepatologist',
        'chronic cholestasis': 'Hepatologist',
        'drug reaction': 'General Physician',
        'allergy': 'Allergist',
        'common cold': 'General Physician',
        'chicken pox': 'Pediatrician',
        'varicose veins': 'Vascular Surgeon'
    };
    
    const normalizedDisease = disease.toLowerCase().trim();
    return diseaseSpecialistMap[normalizedDisease] || 'General Physician';
}

// Emergency action handler
function handleEmergencyAction() {
    const emergencyModal = document.createElement('div');
    emergencyModal.className = 'emergency-modal';
    emergencyModal.innerHTML = `
        <div class="emergency-modal-content">
            <div class="emergency-header">
                <h2>🚨 Emergency Medical Situation</h2>
                <span class="close-emergency" onclick="closeEmergencyModal()">&times;</span>
            </div>
            <div class="emergency-body">
                <p><strong>Based on your symptoms, immediate medical attention is strongly recommended.</strong></p>
                <div class="emergency-options">
                    <h3>Take Action Now:</h3>
                    <button onclick="callEmergencyServices()" class="btn-emergency-action">
                        📞 Call Emergency Services
                    </button>
                    <button onclick="findNearestER()" class="btn-emergency-action">
                        🏥 Find Nearest Emergency Room
                    </button>
                    <button onclick="contactPrimaryPhysician()" class="btn-emergency-action">
                        👨‍⚕️ Contact Primary Physician
                    </button>
                </div>
                <div class="emergency-warning">
                    <p>⚠️ <strong>Do not delay seeking medical care.</strong> These symptoms may indicate a serious condition requiring immediate evaluation.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(emergencyModal);
    emergencyModal.style.display = 'flex';
}

function closeEmergencyModal() {
    const modal = document.querySelector('.emergency-modal');
    if (modal) {
        modal.remove();
    }
}

function callEmergencyServices() {
    alert('Please dial your local emergency number:\\n\\n• US: 911\\n• UK: 999\\n• EU: 112\\n• Australia: 000');
}

function findNearestER() {
    window.open('https://www.google.com/maps/search/emergency+room+near+me', '_blank');
}

function contactPrimaryPhysician() {
    alert('Please contact your primary care physician immediately. If they are unavailable, consider visiting an urgent care center or emergency room.');
}