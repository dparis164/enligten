"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/features/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

const defaultAvatar =
  "https://imgs.search.brave.com/m12gFeEaYTH9TW9JHo1E4K4UFZBIAGpFdv-O_jdbty0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAzLzQ2LzgzLzk2/LzM2MF9GXzM0Njgz/OTY4M182bkFQemJo/cFNrSXBiOHBtQXd1/ZmtDN2M1ZUQ3d1l3/cy5qcGc";

const UserMenu = ({ isMobile }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentUser } = useSelector((state) => state.user);
  const { profile } = useSelector((state) => state.profile);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!currentUser?._id) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        setIsLoadingStatus(true);
        const response = await axios.get(
          "http://localhost:8080/api/subscription/status",
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (response.data && typeof response.data.status === "string") {
          setSubscriptionStatus(response.data.status);
        } else {
          setSubscriptionStatus("free");
        }
      } catch (error) {
        console.error(
          "Error fetching subscription status:",
          error?.response?.data || error.message
        );
        // Don't show error toast for auth errors as user might not be logged in
        if (error.response?.status !== 401) {
          toast.error("Failed to fetch subscription status");
        }
        setSubscriptionStatus("free");
      } finally {
        setIsLoadingStatus(false);
      }
    };

    if (currentUser?._id) {
      fetchSubscriptionStatus();
    }
  }, [currentUser?._id]);

  // If no user data is present, don't render the menu
  if (!currentUser || !profile) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Animation variants for dropdown menu
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      closeMenu();
      setSubscriptionStatus("free");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error(error.message || "Failed to logout");
    }
  };

  // Get the display name from profile or currentUser
  const displayName = profile?.name || currentUser?.name || "User";

  // Get the profile picture URL
  const profilePicture = profile?.profilePicture
    ? `http://localhost:8080${profile.profilePicture}`
    : defaultAvatar;

  const menuItems = [
    { label: "Profile", path: "/profile" },
    { label: "Subscription", path: "/subscription" },
  ];

  // For mobile view, we'll show the menu items directly without dropdown
  if (isMobile) {
    return (
      <div className="w-full">
        <div className="flex items-center mb-4 px-2">
          <img
            src={profilePicture}
            alt="User Avatar"
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
          <div>
            <div className="font-medium">{displayName}</div>
            {!isLoadingStatus && subscriptionStatus === "premium" && (
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                PRO
              </span>
            )}
          </div>
        </div>
        
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label} className="border-b border-gray-100 pb-2">
              <Link 
                href={item.path}
                className="block w-full text-[#074C77] text-base font-medium py-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button 
              onClick={handleLogout}
              className="block w-full text-left text-red-500 font-medium py-2"
            >
              Log out
            </button>
          </li>
        </ul>
      </div>
    );
  }

  // Desktop view with dropdown
  return (
    <div className="relative inline-block">
      <div className="flex items-center cursor-pointer" onClick={toggleMenu}>
        <img
          src={profilePicture}
          alt="User Avatar"
          className="w-10 h-10 rounded-full mr-2 object-cover"
        />
        <div className="flex items-center">
          <span className="font-medium">{displayName}</span>
          {!isLoadingStatus && subscriptionStatus === "premium" && (
            <span className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              PRO
            </span>
          )}
          <span className="ml-1">&#x25BC;</span>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            transition={{ duration: 0.2 }}
          >
            <ul className="py-2 text-sm text-gray-700">
              {menuItems.map((item) => (
                <li
                  key={item.label}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={closeMenu}
                >
                  <Link href={item.path}>{item.label}</Link>
                </li>
              ))}
              <li
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-medium"
              >
                Log out
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
