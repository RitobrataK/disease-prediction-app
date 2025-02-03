import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FiSearch, FiX, FiActivity, FiAlertTriangle } from "react-icons/fi"; // Icons from react-icons

const symptomsList = [
  "anxiety and nervousness", "depression", "shortness of breath", "depressive or psychotic symptoms", "sharp chest pain", 
  "dizziness", "insomnia", "abnormal involuntary movements", "chest tightness", "palpitations", 
  "irregular heartbeat", "breathing fast", "hoarse voice", "sore throat", "difficulty speaking", 
  "cough", "nasal congestion", "throat swelling", "diminished hearing", "lump in throat"
];

export default function SymptomSelector() {
  const [query, setQuery] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [backendMessage, setBackendMessage] = useState("");
  const [predictedDisease, setPredictedDisease] = useState(null);
  const [temporaryFix, setTemporaryFix] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("https://disease-prediction-app-5h44.onrender.com/")
      .then((response) => response.text())
      .then((data) => setBackendMessage(data))
      .catch((error) => console.error("Error fetching backend status:", error));
  }, []);

  const filteredSymptoms = symptomsList.filter(symptom =>
    symptom.toLowerCase().includes(query.toLowerCase())
  );

  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setQuery("");
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://disease-prediction-app-5h44.onrender.com//predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (response.ok) {
        setPredictedDisease(data.predicted_disease);
        setTemporaryFix(data.temporary_fix);
        setSelectedSymptoms([]); // Clear selected symptoms
      } else {
        setPredictedDisease(`⚠️ Error: ${data.error}`);
        setTemporaryFix("");
      }
    } catch (error) {
      console.error("Error:", error);
      setPredictedDisease("❌ Failed to connect to backend.");
      setTemporaryFix("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiActivity className="text-purple-600" />
          Disease Prediction
        </h2>

        {backendMessage && (
          <p className="text-sm text-green-600 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-green-600" />
            {backendMessage}
          </p>
        )}

        <div className="relative">
          <Input
            placeholder="Search symptoms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>

        {query && (
          <div className="mt-2 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm max-h-40 overflow-auto">
            {filteredSymptoms.map((symptom, index) => (
              <div
                key={index}
                className="p-2 hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                onClick={() => addSymptom(symptom)}
              >
                {symptom}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedSymptoms.map((symptom, index) => (
            <Badge
              key={index}
              className="flex items-center gap-2 bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors duration-200"
              onClick={() => removeSymptom(symptom)}
            >
              {symptom} <FiX className="text-sm" />
            </Badge>
          ))}
        </div>

        <Button
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Predicting...
            </span>
          ) : (
            "Predict Disease"
          )}
        </Button>

        {predictedDisease && (
          <Card className="mt-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Prediction Result</h3>
            <p className="text-purple-600 font-bold text-2xl mb-4">{predictedDisease}</p>
            {temporaryFix && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-700">Temporary Fix:</h3>
                <p className="text-gray-600">{temporaryFix}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}