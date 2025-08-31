import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

export default function UserDropdown() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const profileRes = await fetch(`${API_URL}/user-profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate('/login');
  };

  if (!userProfile) {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-stone-200 rounded-full animate-pulse"></div>
        <div className="ml-3">
          <div className="h-4 bg-stone-200 rounded animate-pulse w-20"></div>
          <div className="h-3 bg-stone-200 rounded animate-pulse w-16 mt-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full text-left hover:bg-stone-50 rounded-md p-2 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {userProfile.first_name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-stone-700">
            {userProfile.first_name} {userProfile.last_name}
          </p>
          <p className="text-xs text-stone-500">{userProfile.email}</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-stone-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                navigate('/');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => {
                navigate('/account');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Settings
            </button>
            <button
              onClick={() => {
                navigate('/account');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <User className="mr-2 h-4 w-4" />
              Account Settings
            </button>
            <div className="border-t border-stone-200 my-1"></div>
            <button
              onClick={() => {
                handleSignOut();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
