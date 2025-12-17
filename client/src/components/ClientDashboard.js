import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ClientDashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total_reports: 0, verified_emergencies: 0, active_ngos: 0 });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const reportRes = await axios.get('http://localhost:5000/api/reports');
      const statRes = await axios.get('http://localhost:5000/api/stats');
      setReports(reportRes.data);
      setStats(statRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 mb-10">
      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl transform transition hover:scale-105">
          <h3 className="text-5xl font-black">{stats.total_reports}</h3>
          <p className="uppercase tracking-wide font-bold opacity-80 mt-2">Total Reports</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl transform transition hover:scale-105">
          <h3 className="text-5xl font-black">{stats.verified_emergencies}</h3>
          <p className="uppercase tracking-wide font-bold opacity-80 mt-2">Verified Emergencies</p>
        </div>
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white p-6 rounded-2xl shadow-xl transform transition hover:scale-105">
          <h3 className="text-5xl font-black">{stats.active_ngos}</h3>
          <p className="uppercase tracking-wide font-bold opacity-80 mt-2">Active NGOs</p>
        </div>
      </div>

      {/* LIVE TABLE */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             📡 Live Situation Room
          </h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-red-600 text-sm font-bold">LIVE FEED</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Severity / Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-blue-50 transition duration-150">
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-6 py-4">
                    {report.source === "Google News" ? (
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md border border-blue-200">NEWS API</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-md border border-yellow-200">USER REPORT</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                      {report.disaster_type || "Analyzing..."}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-semibold">
                    {report.location || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {report.title}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === "Verified" ? (
                      <span className="text-green-600 font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                        ✔ Verified
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">
                        ⏳ {report.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;