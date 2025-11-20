// src/components/keywords/KeywordManager.tsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

export default function KeywordManager() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();

  const announceKeywordUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keywords:updated"));
    }
  };

  async function fetchKeywords() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/keywords");
      setKeywords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addKeyword() {
    if (!term.trim() || !user || adding) return;
    setAdding(true);
    try {
      await axios.post("/api/keywords", { term: term.trim() });
      setTerm("");
      await fetchKeywords();
      announceKeywordUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add keyword");
    } finally {
      setAdding(false);
    }
  }

  async function toggleKeyword(keyword: any) {
    try {
      await axios.put("/api/keywords", { id: keyword.id, active: !keyword.active });
      await fetchKeywords();
      announceKeywordUpdate();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteKeyword(id: string) {
    if (!confirm("Are you sure you want to delete this keyword?")) return;
    try {
      await axios.delete(`/api/keywords?id=${id}`);
      await fetchKeywords();
      announceKeywordUpdate();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (user) {
      fetchKeywords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addKeyword();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter keyword to monitor..."
          className="input flex-1"
          disabled={adding}
        />
        <button
          onClick={addKeyword}
          disabled={!term.trim() || adding}
          className="btn-secondary whitespace-nowrap"
        >
          {adding ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Add"
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading keywords...</div>
      ) : keywords.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-sm">No keywords yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keywords.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => toggleKeyword(k)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${
                    k.active ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      k.active ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{k.term}</div>
                  {k.tags && k.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {k.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="badge-info text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`badge ${k.active ? "badge-success" : "badge-warning"}`}>
                  {k.active ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() => deleteKeyword(k.id)}
                className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete keyword"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
