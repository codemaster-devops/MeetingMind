import React, { useState } from 'react';
import { CheckCircleIcon } from './Icons';
import { initiateCheckout } from '../services/subscriptionService';

interface PricingViewProps {
  userId: string;
  onBack: () => void;
}

const PricingView: React.FC<PricingViewProps> = ({ userId, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await initiateCheckout(userId);
      // In a real flow, the user is redirected away. 
      // If we are simulating:
      // alert("Upgrade simulated! You are now on the Pro plan.");
    } catch (error) {
      alert("Failed to initiate checkout. Check console.");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-indigo-600 mb-6 font-medium">
             ← Back to Dashboard
        </button>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose your plan</h2>
        <p className="text-slate-500 text-lg">Unlock unlimited meetings and advanced features.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-slate-900">$0</span>
            <span className="text-slate-500">/month</span>
          </div>
          <p className="text-slate-600 mb-8 text-sm">Perfect for individuals just getting started with AI meeting notes.</p>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>3 Meetings per month</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>Standard processing speed</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>Basic Summary & Actions</span>
            </li>
          </ul>

          <button 
            disabled
            className="w-full py-3 px-4 bg-slate-100 text-slate-500 font-medium rounded-xl cursor-default"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold text-slate-900">$12</span>
            <span className="text-slate-500">/month</span>
          </div>
          <p className="text-slate-600 mb-8 text-sm">For power users and teams who need unlimited access.</p>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span><strong>Unlimited</strong> Meetings</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>Priority Processing</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>Email Support</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <span>Early access to new features</span>
            </li>
          </ul>

          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {loading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-400 mt-8">
        Secure payments powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
};

export default PricingView;