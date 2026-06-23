import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("deployment");

  // Form State: Deployment
  const [coopCode, setCoopCode] = useState(""); 
  const [coopName, setCoopName] = useState("");
  const [county, setCounty] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPassword, setManagerPassword] = useState("");

  // State: Cooperative Management
  const [cooperatives, setCooperatives] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 💡 NEW: Search bar state

  // State for Inline Editing
  const [editingCoopId, setEditingCoopId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    coopCode: "", 
    name: "",
    county: "",
    subCounty: "",
    managerName: "",
  });

  // Global States
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);

// ==================== STRICT ROLE & SECURITY GUARD ====================
  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    } else if (user.role === 'MANAGER') {
      navigate('/manager-dashboard', { replace: true });
    } else if (user.role === 'FARMER') {
      navigate('/farmer-dashboard', { replace: true });
    }
  }, [user, navigate]);
  // ======================================================================
  const fetchCooperatives = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/admin/cooperatives",
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCooperatives(data);
      }
    } catch (error) {
      console.error("Network exception fetching cooperatives.", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manage") {
        fetchCooperatives();
        setSearchQuery(""); // Clear search when tab opens
    }
  }, [activeTab]);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Redirecting...
      </div>
    );

  const handleProvisionSystem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/admin/provision-station",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            coopCode, 
            coopName,
            county,
            subCounty,
            managerUsername: managerName,
            managerPassword,
          }),
        }
      );
      const resultText = await response.text();
      if (response.ok) {
        setStatus({ type: "success", text: resultText });
        setCoopCode(""); // Reset
        setCoopName("");
        setCounty("");
        setSubCounty("");
        setManagerName("");
        setManagerPassword("");
      } else {
        setStatus({
          type: "error",
          text: resultText || "Failed to complete provision sequence.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: "Network dispatch failure. Ensure backend is active.",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================================
  // EDIT AND DELETE FUNCTIONALITY
  // =====================================================================
  const handleEditClick = (coop) => {
    setEditingCoopId(coop.cooperativeId);
    setEditFormData({
      coopCode: coop.coopCode || "", 
      name: coop.name,
      county: coop.county,
      subCounty: coop.subCounty,
      managerName: coop.managerName,
    });
  };

  const handleSaveEdit = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/admin/cooperatives/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(editFormData), 
        }
      );
      const text = await response.text();
      if (response.ok) {
        setStatus({
          type: "success",
          text: "Cooperative updated successfully.",
        });
        setEditingCoopId(null);
        fetchCooperatives(); 
      } else {
        setStatus({ type: "error", text });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Failed to update cooperative record.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoop = async (id, name) => {
    if (
      !window.confirm(
        `CRITICAL WARNING: Are you sure you want to permanently delete '${name}'?\n\nThis will also delete the station manager and all farmers assigned to this cooperative.`
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/admin/cooperatives/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const text = await response.text();
      if (response.ok) {
        setStatus({
          type: "success",
          text: "Cooperative eradicated from system.",
        });
        fetchCooperatives(); 
      } else {
        setStatus({ type: "error", text });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Network exception during entity drop execution loops.",
      });
    } finally {
      setLoading(false);
    }
  };
  // =====================================================================

  const formatDate = (dateString) => {
    if (!dateString) return "Pending...";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // 💡 NEW: Real-time Universal Filter Logic
  const filteredCooperatives = cooperatives.filter((coop) => {
    const query = searchQuery.toLowerCase();
    const matchName = (coop.name || "").toLowerCase().includes(query);
    const matchCode = (coop.coopCode || "").toLowerCase().includes(query);
    const matchCounty = (coop.county || "").toLowerCase().includes(query);
    const matchSubCounty = (coop.subCounty || "").toLowerCase().includes(query);
    const matchManager = (coop.managerName || "").toLowerCase().includes(query);

    return matchName || matchCode || matchCounty || matchSubCounty || matchManager;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8 animate-fade-in antialiased">
      <div className="border-b border-slate-200 pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System Infrastructure
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Administrative centralized station deployment terminal.
          </p>
        </div>
        <div className="bg-slate-200/70 p-1.5 rounded-xl flex flex-row w-full lg:w-auto overflow-x-auto hide-scrollbar snap-x">
          <button
            onClick={() => {
              setActiveTab("deployment");
              setStatus({ type: "", text: "" });
            }}
            className={`flex-1 lg:flex-none text-center px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap snap-center ${activeTab === "deployment" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Station Deployment
          </button>
          <button
            onClick={() => {
              setActiveTab("manage");
              setStatus({ type: "", text: "" });
            }}
            className={`flex-1 lg:flex-none text-center px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap snap-center ${activeTab === "manage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Manage Cooperatives
          </button>
        </div>
      </div>

      {status.text && (
        <div
          className={`p-4 border text-xs sm:text-sm font-semibold rounded-xl animate-shake flex items-start sm:items-center gap-3 ${status.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"}`}
        >
          <span
            className={`mt-1 sm:mt-0 shrink-0 h-2 w-2 rounded-full ${status.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
          ></span>
          <span className="break-words">{status.text}</span>
        </div>
      )}

      {activeTab === "deployment" && (
        <form
          onSubmit={handleProvisionSystem}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm space-y-8"
        >
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Deploy New Branch
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Initialize a physical cooperative processing cluster and assign
              its primary station manager concurrently.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-2">
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Cooperative Parameters
              </h3>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                  Cooperative Name
                </label>
                <input
                  type="text"
                  value={coopName}
                  onChange={(e) => setCoopName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  placeholder="e.g., Mau Dairy Cooperative"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2 flex justify-between items-center">
                  <span>Cooperative Code</span>
                  <span className="text-slate-400 font-medium normal-case">Unique ID</span>
                </label>
                <input
                  type="text"
                  value={coopCode}
                  onChange={(e) => setCoopCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-mono"
                  placeholder="e.g., MR10"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                    County
                  </label>
                  <input
                    type="text"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    placeholder="e.g., Kericho"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                    Sub-County Branch
                  </label>
                  <input
                    type="text"
                    value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    placeholder="e.g., Belgut"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:border-l lg:border-slate-100 lg:pl-10 border-t lg:border-t-0 pt-8 lg:pt-0 border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Manager Credentials
              </h3>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                  Account Username
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  placeholder="e.g., manager_sk"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                  Initial Access Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-sm disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
            >
              {loading
                ? "Executing Transactional Provisions..."
                : "Deploy Branch System"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MANAGE COOPERATIVES */}
      {activeTab === "manage" && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
          
          {/* 💡 NEW: Header area converted to flex container for Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Cooperative Directory
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Overview of all active stations, their managers, and locations.
              </p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, name, location..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white transition-all text-slate-700 font-medium"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="w-full overflow-x-auto border border-slate-200/60 rounded-xl block max-w-full shadow-inner">
            <table className="w-full min-w-[950px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
                  <th className="p-4 whitespace-nowrap">ID</th>
                  <th className="p-4 whitespace-nowrap">Coop Code</th> 
                  <th className="p-4 whitespace-nowrap">Cooperative Name</th>
                  <th className="p-4 whitespace-nowrap">Location (County / Sub)</th>
                  <th className="p-4 whitespace-nowrap">Manager</th>
                  <th className="p-4 whitespace-nowrap">Farmers</th>
                  <th className="p-4 whitespace-nowrap">Registration Date</th>
                  <th className="p-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loadingData ? (
                  <tr>
                    <td colSpan="8" className="text-center p-10 text-slate-400 text-sm">
                      Loading infrastructure data...
                    </td>
                  </tr>
                ) : filteredCooperatives.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-10 text-slate-400 text-sm">
                      {cooperatives.length === 0 
                        ? "No active cooperatives deployed in the network yet." 
                        : "No cooperatives match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  // 💡 NEW: Map over filteredCooperatives instead of cooperatives
                  filteredCooperatives.map((coop) => (
                    <tr
                      key={coop.cooperativeId}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="p-4 font-mono font-bold text-slate-900">
                        #{coop.cooperativeId}
                      </td>

                      {/* INLINE EDITING LOGIC */}
                      {editingCoopId === coop.cooperativeId ? (
                        <>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editFormData.coopCode}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  coopCode: e.target.value.toUpperCase(),
                                })
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-emerald-700 font-bold"
                              placeholder="Code"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editFormData.county}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    county: e.target.value,
                                  })
                                }
                                className="w-1/2 border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                value={editFormData.subCounty}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    subCounty: e.target.value,
                                  })
                                }
                                className="w-1/2 border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editFormData.managerName}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  managerName: e.target.value,
                                })
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Manager Username"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-mono font-bold text-emerald-700">
                            {coop.coopCode || "N/A"}
                          </td>
                          <td className="p-4 text-slate-900 font-bold">
                            {coop.name}
                          </td>
                          <td className="p-4 text-slate-500 text-xs sm:text-sm">
                            {coop.county}{" "}
                            <span className="text-slate-300 mx-1">|</span>{" "}
                            {coop.subCounty}
                          </td>
                          <td className="p-4 text-emerald-700 font-semibold">
                            {coop.managerName || "Unassigned"}
                          </td>
                        </>
                      )}

                      <td className="p-4 font-mono">{coop.farmerCount || 0}</td>
                      <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(coop.timestamp)}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        {editingCoopId === coop.cooperativeId ? (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleSaveEdit(coop.cooperativeId)}
                              disabled={loading}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCoopId(null)}
                              className="text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleEditClick(coop)}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-xs hover:underline transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteCoop(coop.cooperativeId, coop.name)
                              }
                              className="text-rose-600 hover:text-rose-800 font-bold text-xs hover:underline transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}