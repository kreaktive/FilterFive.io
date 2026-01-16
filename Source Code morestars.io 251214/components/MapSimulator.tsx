import React, { useState } from 'react';
import { COLORS } from '../constants';
import { Star, MapPin } from 'lucide-react';

const MapSimulator: React.FC = () => {
    const [reviews, setReviews] = useState(12); // User starts low
    
    // Competitors (Static)
    const comp1 = { name: "Pro Service Experts", reviews: 145, rating: 4.8, isMe: false };
    const comp2 = { name: "City Best Local", reviews: 88, rating: 4.6, isMe: false };
    const comp3 = { name: "Budget Bros", reviews: 42, rating: 4.2, isMe: false };

    const myBusiness = { name: "Your Business", reviews: reviews, rating: 4.9, isMe: true };

    // Sort to determine rank
    const all = [comp1, comp2, comp3, myBusiness].sort((a, b) => b.reviews - a.reviews);
    const myRank = all.findIndex(b => b.isMe) + 1;

    // Slider percent
    const sliderPercent = ((reviews - 12) / (200 - 12)) * 100;

    return (
        <div className="py-20 w-full relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                        Don't Let Them Win Just Because They're Louder
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your competitors aren't better than you. They just have more reviews. Drag the slider to see how easy it is to overtake them.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Controls */}
                    <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10 text-left">
                        <label className="block text-sm font-bold text-gray-500 mb-6 uppercase tracking-wide">
                            Add Reviews to Your Profile
                        </label>
                        
                        <div className="relative h-4 w-full bg-gray-100 rounded-full mb-10">
                            <div className="absolute h-full bg-blue-600 rounded-full" style={{ width: `${sliderPercent}%` }}></div>
                            <input
                                type="range"
                                min="12"
                                max="200"
                                value={reviews}
                                onChange={(e) => setReviews(parseInt(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0 z-20"
                            />
                            <div 
                                className="absolute w-8 h-8 bg-white border-2 border-blue-600 rounded-full shadow-lg -mt-2 pointer-events-none transition-all duration-75 flex items-center justify-center z-10"
                                style={{ left: `calc(${sliderPercent}% - 16px)` }}
                            >
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>
                        
                        <div className="text-center mb-8">
                            <div className="text-7xl font-extrabold text-[#23001E] mb-2 transition-all duration-100">{reviews}</div>
                            <p className="text-gray-500 font-medium">Your Total Reviews</p>
                        </div>

                        <div className={`p-4 rounded-xl border text-center transition-colors duration-300 ${myRank <= 3 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            <p className="font-bold text-lg">
                                {myRank === 1 ? "🥇 You are #1 in the Map Pack!" : 
                                 myRank === 2 ? "🥈 You're beating 2 competitors!" :
                                 myRank === 3 ? "🥉 You made the Top 3!" : "You are invisible on page 2."}
                            </p>
                        </div>
                    </div>

                    {/* Simulation */}
                    <div className="lg:col-span-7 relative">
                        {/* Google Map Mockup Container */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-md mx-auto relative transform rotate-1 hover:rotate-0 transition-transform duration-500 text-left">
                            <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center gap-2">
                                <MapPin size={16} className="text-red-500" />
                                <span className="font-bold text-gray-600 text-sm">Businesses near you</span>
                            </div>
                            
                            {/* The List */}
                            <div className="relative h-[360px] bg-white">
                                {all.map((biz, i) => (
                                    <div 
                                        key={biz.name}
                                        className={`absolute w-full p-4 flex items-start gap-4 transition-all duration-500 ease-in-out border-b border-gray-50 ${biz.isMe ? 'bg-blue-50/80 z-20' : 'bg-white z-10'}`}
                                        style={{ 
                                            transform: `translateY(${i * 90}px)`,
                                            height: '90px'
                                        }} 
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {biz.isMe ? 
                                                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-xs shadow-md shadow-blue-200">You</div> :
                                                <div className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center font-bold text-sm shadow-sm">{String.fromCharCode(65 + i)}</div>
                                            }
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className={`font-bold text-base ${biz.isMe ? 'text-blue-700' : 'text-gray-900'}`}>{biz.name}</h4>
                                            <div className="flex items-center gap-1.5 text-sm mt-1">
                                                <span className="font-bold text-orange-500">{biz.rating}</span>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, stars) => (
                                                        <Star key={stars} size={14} fill="currentColor" />
                                                    ))}
                                                </div>
                                                <span className="text-gray-500">({biz.reviews})</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 font-medium">Service Business • Open now</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                                <span className="text-blue-600 font-bold text-sm cursor-pointer hover:underline">View all businesses</span>
                            </div>
                        </div>
                        
                        {/* Decorative Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-100 to-purple-100 opacity-30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MapSimulator;