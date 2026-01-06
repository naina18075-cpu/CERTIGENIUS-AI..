import React from 'react';
import { ViewMode } from '../types';
import { Wand2, Award } from 'lucide-react';

interface WelcomeScreenProps {
  onViewChange: (mode: ViewMode) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onViewChange }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 md:p-12 max-w-2xl w-full text-center transform transition-all duration-300 hover:scale-105">
        <Award className="mx-auto h-20 w-20 text-indigo-600 mb-6" strokeWidth={1.5} />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">CertiGenius AI</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Effortlessly create stunning certificates with AI-powered drafting, multiple signers, and robust batch processing.
        </p>
        <button
          onClick={() => onViewChange(ViewMode.ADMIN_DESIGN)}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center mx-auto"
        >
          <Wand2 className="mr-3 h-6 w-6" />
          Let's Create Certificates
        </button>
        <p className="mt-8 text-sm text-gray-400">Your next event's recognition, simplified.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;