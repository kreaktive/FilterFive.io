import React from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';

// Standalone component to debug routing
export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#ffffff', color: COLORS.dark }}>
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-5xl font-extrabold" style={{ color: COLORS.dark }}>
          Test Page Works!
        </h1>
        <p className="text-xl text-gray-600">
          The routing logic is functioning correctly with React Router.
        </p>
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="font-mono text-sm">Current Path: {window.location.hash}</p>
        </div>
        
        <div className="pt-8">
            <Link to="/" className="px-8 py-3 rounded-full font-bold text-white transition-transform hover:scale-105" style={{ backgroundColor: COLORS.gold, color: COLORS.dark }}>
                Return Home
            </Link>
        </div>
      </div>
    </div>
  );
}