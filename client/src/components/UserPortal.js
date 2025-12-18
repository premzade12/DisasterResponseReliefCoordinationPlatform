import React, { useState } from 'react';
import axios from 'axios';

function UserPortal() {
  const [formData, setFormData] = useState({ title: '', location: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setAiResult(null); // Clear previous AI result
  };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload an image for AI verification.");
    
    setLoading(true);
    setAiResult(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('image', selectedFile);

      // Submit report with file upload and AI analysis
      const response = await axios.post('http://localhost:5000/api/report', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAiResult(response.data.ai_result);
      alert("✅ Report Submitted! AI Analysis Complete.");
      
      // Reset form
      setFormData({ title: '', location: '', description: '' });
      setSelectedFile(null);
      
    } catch (err) {
      console.error(err);
      alert("Submission Failed. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[85vh] p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-yellow-400 p-6 text-center">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">📢 Report Incident</h2>
          <p className="text-yellow-900 font-medium text-sm mt-1">Submit details for AI Verification</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Title</label>
              <input name="title" onChange={handleChange} required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" 
                placeholder="e.g., Heavy Flooding in Market" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Location</label>
              <input name="location" onChange={handleChange} required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition" 
                placeholder="City, Area" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Description</label>
              <textarea name="description" rows="3" onChange={handleChange} required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"></textarea>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 dashed-border">
              <label className="block text-red-700 font-bold mb-2">Upload Evidence (Required)</label>
              <input type="file" onChange={handleFileChange} required 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer"/>
            </div>

            {aiResult && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg animate-fade-in">
                <p className="font-bold text-blue-700">🤖 AI Analysis Result:</p>
                <pre className="text-gray-700 whitespace-pre-wrap mt-1 text-sm">{aiResult}</pre>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
              {loading ? "PROCESSING..." : "SUBMIT REPORT"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserPortal;