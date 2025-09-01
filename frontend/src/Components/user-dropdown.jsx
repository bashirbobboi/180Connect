import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Shield, Cog, LogOut } from "lucide-react";
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

  // Helper function to get user initials
  const getUserInitials = () => {
    const first = userProfile?.first_name?.[0]?.toUpperCase() || '';
    const last = userProfile?.last_name?.[0]?.toUpperCase() || '';
    return first + last || 'U';
  };

  // Helper function to get role badge styles
  const getRoleBadgeStyles = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return "bg-purple-100 text-purple-700";
      case 'editor':
        return "bg-blue-100 text-blue-700";
      case 'viewer':
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!userProfile) {
    return (
      <div className="size-8 animate-pulse rounded-full bg-gray-200" />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none cursor-pointer transition-all duration-200"
      >
        <div className="size-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
          <span className="text-white text-sm font-medium">
            {getUserInitials()}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72">
          {userProfile ? (
            <>
              {/* User Info Section */}
              <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
                <div className="size-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile.first_name} {userProfile.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile.email}
                  </p>
                </div>
                <div className={cn("text-xs font-medium px-2 py-1 rounded-full", getRoleBadgeStyles(userProfile.role))}>
                  {userProfile.role || "No role"}
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/');
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Home className="!mr-2 !size-4" />
                  <span>Home</span>
                </button>
                
                {userProfile.role?.toLowerCase() === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Shield className="!mr-2 !size-4" />
                    <span>Admin Settings</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Cog className="!mr-2 !size-4" />
                  <span>Account Settings</span>
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 !hover:rounded-md transition-colors"
                >
                  <LogOut className="!mr-2 !size-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
