import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

// Categorized questions
const questions = [
  { category: "Experience-Expertise", question: "Have you ever participated in or contributed to a DAO before?" },
  { category: "Experience-Expertise", question: "Do you possess technical skills relevant to the DAO's projects (e.g., smart contracts, dApp development)?" },
  { category: "Experience-Expertise", question: "Do you have experience with open-source projects, particularly in the Ethereum ecosystem?" },
  { category: "Experience-Expertise", question: "Are you interested in contributing to specific initiatives or projects within the DAO?" },
  { category: "Experience-Expertise", question: "Do you have endorsements from well-known members of the Ethereum community or previous DAOs?" },
  { category: "Principle-Value", question: "Do you think that transparency and openness should always be prioritized over privacy and security in a DAO's operations?" },
  { category: "Principle-Value", question: "Should a DAO primarily focus on supporting and funding projects that align with its core values and principles?" },
  { category: "Decentralization-Governance", question: "Do you believe that full decentralization should always be the primary goal of a DAO?" },
  { category: "Decentralization-Governance", question: "Do you think that a DAO should prioritize a more hierarchical governance structure for efficient decision-making?" },
  { category: "Decentralization-Governance", question: "Do you believe that community-driven governance models should always be preferred over more centralized alternatives?" },
  { category: "Regulations-Compliance", question: "Do you think that DAOs should actively engage with regulators to ensure compliance and foster mainstream adoption?" },
  { category: "Regulations-Compliance", question: "Do you support the idea of implementing self-regulation within the Ethereum ecosystem to minimize the need for external regulations?" },
  { category: "Coordination-Collaboration", question: "Do you believe that DAOs should primarily focus on human coordination and collaboration over technical solutions?" },
  { category: "Coordination-Collaboration", question: "Are you open to collaborating with other members of the Ethereum community to achieve common goals?" },
  { category: "Coordination-Collaboration", question: "Do you believe that DAOs should prioritize open-source development to foster innovation and collaboration within the Ethereum ecosystem?" },
  { category: "Finance-Sustainability", question: "Is the financial success of a DAO more important than its impact on the broader Ethereum ecosystem?" },
  { category: "Finance-Sustainability", question: "Should a DAO prioritize long-term, sustainable growth over short-term financial gains?" },
];

// Get unique categories
const categories = [...new Set(questions.map(q => q.category))];

// Ensure delegate scores match the number of categories
const delegates = [
  { name: "Delegate A", scores: [4, 2, 5, 3, 4, 4] },
  { name: "Delegate B", scores: [2, 4, 3, 5, 1, 2] },
  { name: "Delegate C", scores: [5, 3, 2, 4, 5, 2] },
];

const App = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userScores, setUserScores] = useState(Array(questions.length).fill(0));
  const [showResults, setShowResults] = useState(false);
  const [bestMatch, setBestMatch] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleAnswer = (score) => {
    const newScores = [...userScores];
    newScores[currentQuestion] = score;
    setUserScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz(newScores);
    }
  };

  const finishQuiz = (scores) => {
    const aggregatedScores = aggregateScores(scores);
    const match = findBestMatch(aggregatedScores);
    if (match) {
      setBestMatch(match);
      setShowResults(true);
      saveQuizResult(aggregatedScores, match);
    } else {
      setError("No matching delegate found. Please try again.");
      resetQuiz();
    }
  };

  const aggregateScores = (scores) => {
    return categories.map(category => {
      const categoryScores = questions
        .map((q, i) => q.category === category ? scores[i] : null)
        .filter(score => score !== null);
      return Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);
    });
  };

  const findBestMatch = (scores) => {
    if (delegates.length === 0) {
      setError("No delegates available for matching.");
      return null;
    }
    const bestMatch = delegates.reduce((best, current) => {
      const currentSimilarity = calculateSimilarity(scores, current.scores);
      return currentSimilarity > best.similarity ? { delegate: current, similarity: currentSimilarity } : best;
    }, { delegate: null, similarity: -1 });
    return bestMatch.delegate;
  };

  const calculateSimilarity = (userScores, delegateScores) => {
    return userScores.reduce((sum, score, index) => sum + (5 - Math.abs(score - delegateScores[index])), 0);
  };

  const saveQuizResult = (scores, match) => {
    if (match) {
      const newResult = { date: new Date().toISOString(), scores, matchName: match.name };
      const updatedHistory = [...quizHistory, newResult];
      setQuizHistory(updatedHistory);
      localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserScores(Array(questions.length).fill(0));
    setShowResults(false);
    setBestMatch(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
        <button onClick={resetQuiz} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Try Again
        </button>
      </div>
    );
  }

  if (showResults && bestMatch) {
    const chartData = categories.map((category, index) => ({
      subject: category,
      user: aggregateScores(userScores)[index],
      delegate: bestMatch.scores[index],
    }));

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Your Best Match: {bestMatch.name}</h1>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 5]} />
            <Radar name="You" dataKey="user" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Radar name={bestMatch.name} dataKey="delegate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
        <button onClick={resetQuiz} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Retake Quiz
        </button>
        <h2 className="text-xl font-bold mt-8 mb-4">Quiz History</h2>
        <ul>
          {quizHistory.map((result, index) => (
            <li key={index} className="mb-2">
              {new Date(result.date).toLocaleString()}: Matched with {result.matchName}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Political Alignment Quiz</h1>
      <p className="mb-2 font-semibold">{questions[currentQuestion].category}</p>
      <p className="mb-4">{questions[currentQuestion].question}</p>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => handleAnswer(score)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {score}
          </button>
        ))}
      </div>
      <p className="mt-4">Question {currentQuestion + 1} of {questions.length}</p>
    </div>
  );
};

export default App;