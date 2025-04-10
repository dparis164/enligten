"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AiTwotoneEdit } from "react-icons/ai";
import Cookies from "js-cookie";
import {
  fetchProfile,
  updateProfile,
  resetProfile,
} from "@/features/user/profileSlice";
import { fetchLoggedInUser, logout } from "@/features/user/userSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

// Define API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Configure axios for this component
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add the default avatar URL at the top with other constants
const defaultAvatar =
  "https://imgs.search.brave.com/m12gFeEaYTH9TW9JHo1E4K4UFZBIAGpFdv-O_jdbty0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAzLzQ2LzgzLzk2/LzM2MF9GXzM0Njgz/OTY4M182bkFQemJo/cFNrSXBiOHBtQXd1/ZmtDN2M1ZUQ3d1l3/cy5qcGc";

const ProfileForm = () => {
  const dispatch = useDispatch();
  const { profile, status, error } = useSelector((state) => state.profile);
  const { currentUser } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("About me");
  const [formData, setFormData] = useState({
    // About Me
    name: "",
    tandemID: "",
    dateOfBirth: "",
    location: "",
    description: "",
    about: "",
    partnerPreference: "",
    learningGoals: "",

    // Languages
    nativeLanguage: "",
    fluentLanguage: "",
    learningLanguage: "",
    translateLanguage: "",

    // Learning Preferences
    communication: "Not set",
    timeCommitment: "Not set",
    learningSchedule: "Not set",
    correctionPreference: "Not set",

    // Topics
    topics: ["Life"],
    newTopic: "",

    // Settings
    showLocation: true,
    showTandemID: true,
    notifications: true,

    // Following
    followingTab: "Following",

    // Profile Picture
    profilePicture: "",

    // Photos
    photos: [],
  });

  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [unblockLoading, setUnblockLoading] = useState({});

  // Fetch profile and user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchLoggedInUser()).unwrap();
        await dispatch(fetchProfile()).unwrap();
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [dispatch]);

  // Populate form data with fetched profile and user data
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || "",
        tandemID: profile.tandemID || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        location: profile.location || "",
        description: profile.description || "",
        about: profile.about || "",
        partnerPreference: profile.partnerPreference || "",
        learningGoals: profile.learningGoals || "",
        nativeLanguage: profile.nativeLanguage || "",
        fluentLanguage: profile.fluentLanguage || "",
        learningLanguage: profile.learningLanguage || "",
        translateLanguage: profile.translateLanguage || "",
        communication: profile.communication || "Not set",
        timeCommitment: profile.timeCommitment || "Not set",
        learningSchedule: profile.learningSchedule || "Not set",
        correctionPreference: profile.correctionPreference || "Not set",
        topics: profile.topics || ["Life"],
        showLocation: profile.showLocation ?? true,
        showTandemID: profile.showTandemID ?? true,
        notifications: profile.notifications ?? true,
        profilePicture: profile.profilePicture || "",
        photos: profile.photos || [],
      }));
    }
  }, [profile]);

  // Add new useEffect for fetching following/followers/blocked lists
  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        const token = Cookies.get("token");
        if (!token || !profile) return;

        // Get current user's profile with following/followers data
        const myProfileResponse = await axiosInstance.get("/profile/me");
        const myProfileData = myProfileResponse.data;

        // Fetch following users
        if (
          myProfileData?.following &&
          Array.isArray(myProfileData.following)
        ) {
          const followingPromises = myProfileData.following.map(
            async (userId) => {
              try {
                const response = await axiosInstance.get(`/profile/${userId}`);
                if (response.data?.profile) {
                  const profileData = response.data.profile;
                  return {
                    userId: profileData.userId,
                    name: profileData.name,
                    tandemID: profileData.tandemID,
                    profilePicture: profileData.profilePicture,
                    _id: profileData._id,
                  };
                }
                return null;
              } catch (error) {
                console.error(
                  `Error fetching profile for user ${userId}:`,
                  error
                );
                return null;
              }
            }
          );

          const followingProfiles = (
            await Promise.all(followingPromises)
          ).filter(Boolean);
          setFollowing(followingProfiles);
        }

        // Fetch followers directly from the profile's followers array
        try {
          console.log("Fetching followers...");
          const followersResponse = await axiosInstance.get(
            "/profile/followers"
          );
          console.log("Followers response:", followersResponse.data);

          if (Array.isArray(followersResponse.data)) {
            const validFollowers = followersResponse.data
              .filter((follower) => follower && follower.userId)
              .map((follower) => ({
                userId: follower.userId,
                name: follower.name || "Anonymous User",
                tandemID: follower.tandemID || "unknown",
                profilePicture: follower.profilePicture,
                _id: follower._id || follower.userId,
              }));
            console.log("Setting followers:", validFollowers);
            setFollowers(validFollowers);
          } else {
            console.error(
              "Invalid followers data received:",
              followersResponse.data
            );
            setFollowers([]);
          }
        } catch (error) {
          console.error(
            "Error fetching followers:",
            error.response?.data || error
          );
          setFollowers([]);
        }

        // Fetch blocked users
        await fetchBlockedUsers();
      } catch (error) {
        console.error("Error fetching follow data:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to fetch user relationships";
        toast.error(errorMessage);
        setFollowing([]);
        setFollowers([]);
        setBlocked([]);
      }
    };

    if (profile) {
      fetchFollowData();
    }
  }, [profile]);

  // Add the fetchBlockedUsers function
  const fetchBlockedUsers = async () => {
    try {
      const response = await axiosInstance.get("/profile/blocked");
      if (Array.isArray(response.data)) {
        const validBlockedUsers = response.data
          .filter((user) => user && user.userId)
          .map((user) => ({
            userId: user.userId,
            name: user.name || "Anonymous User",
            tandemID: user.tandemID || "unknown",
            profilePicture: user.profilePicture,
            _id: user._id || user.userId,
          }));
        setBlocked(validBlockedUsers);
      } else {
        setBlocked([]);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error("Failed to fetch blocked users");
      setBlocked([]);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblockLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await axiosInstance.post(`/profile/unblock/${userId}`);
      toast.success("User unblocked successfully");
      // Refresh the blocked users list
      await fetchBlockedUsers();
      // Also refresh the profile data to ensure all lists are up to date
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    } finally {
      setUnblockLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const menuItems = [
    { label: "About me" },
    { label: "Languages" },
    { label: "Learning Preferences" },
    { label: "Topics" },
    { label: "Following" },
    { label: "Settings" },
    { label: "Visitors" },
    { label: "Log out" },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSaveError(null);
    setSuccessMessage("");

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      await dispatch(updateProfile(formData)).unwrap();
      setSuccessMessage("Profile saved successfully!");

      // Refresh profile data
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError(
        error.message || "An error occurred while saving the profile."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const ToggleSwitch = ({ isOn, handleToggle }) => (
    <div
      className={`relative inline-block w-10 h-6 rounded-full cursor-pointer transition-colors ${
        isOn ? "bg-blue-500" : "bg-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
          isOn ? "transform translate-x-4" : ""
        }`}
      />
    </div>
  );

  const handleAddTopic = () => {
    if (formData.newTopic.trim()) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, prev.newTopic.trim()],
        newTopic: "",
      }));
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((topic) => topic !== topicToRemove),
    }));
  };

  const handleMenuItemClick = async (label) => {
    if (label === "Log out") {
      try {
        await dispatch(logout()).unwrap();
        toast.success("Logged out successfully");
        router.push("/login");
      } catch (error) {
        toast.error(error.message || "Failed to logout");
      }
    } else {
      setActiveTab(label);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:8080/api/auth/delete-account",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }

      // Clear Redux state
      dispatch(resetProfile());
      dispatch(logout());

      // Clear token and other local storage/cookies
      Cookies.remove("token");
      localStorage.clear();

      toast.success("Account deleted successfully");

      // Use replace instead of push to prevent going back to the profile
      router.replace("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "About me":
        return (
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <img
                  src={
                    formData.profilePicture
                      ? `http://localhost:8080${formData.profilePicture}`
                      : "/default-avatar.png"
                  }
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-gray-200"
                />
                <label
                  htmlFor="profile-picture-input"
                  className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <AiTwotoneEdit className="w-5 h-5 text-gray-600" />
                </label>
                <input
                  id="profile-picture-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Alert Messages */}
            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {saveError}
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
                {successMessage}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-6">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
              <FormField
                label="Tandem ID"
                value={formData.tandemID}
                onChange={(e) => handleInputChange("tandemID", e.target.value)}
                required
              />
              <FormField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                required
              />
              <FormField
                label="Location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
              />
              <TextAreaField
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe yourself"
              />
            </div>

            {/* Additional Text Areas */}
            <div className="grid gap-6 mt-8">
              <TextAreaField
                label="What do you like to talk about?"
                value={formData.about}
                onChange={(e) => handleInputChange("about", e.target.value)}
              />
              <TextAreaField
                label="What's your ideal language exchange partner like?"
                value={formData.partnerPreference}
                onChange={(e) => handleInputChange("partnerPreference", e.target.value)}
              />
              <TextAreaField
                label="What are your language learning goals?"
                value={formData.learningGoals}
                onChange={(e) => handleInputChange("learningGoals", e.target.value)}
              />
            </div>

            {/* Photos Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.photos &&
                  formData.photos.map((photo, index) => (
                    <div key={index} className="relative pt-[100%]">
                      <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <img
                          src={`http://localhost:8080${photo}`}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleDeletePhoto(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                {(!formData.photos || formData.photos.length < 5) && (
                  <div className="relative pt-[100%]">
                    <label className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        multiple={true}
                        disabled={isLoading}
                      />
                      <span className="text-gray-400 text-2xl">+</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "Languages":
        return (
          <div className="space-y-6">
            <LanguageFormSection
              title="I am native in"
              value={formData.nativeLanguage}
              onChange={(e) =>
                handleInputChange("nativeLanguage", e.target.value)
              }
            />
            <LanguageFormSection
              title="I am fluent in"
              value={formData.fluentLanguage}
              onChange={(e) =>
                handleInputChange("fluentLanguage", e.target.value)
              }
            />
            <LanguageFormSection
              title="I am learning"
              value={formData.learningLanguage}
              onChange={(e) =>
                handleInputChange("learningLanguage", e.target.value)
              }
            />
            <div className="border-b py-4">
              <h3 className="font-semibold text-lg mb-4">
                Translate incoming messages to
              </h3>
              <select
                value={formData.translateLanguage}
                onChange={(e) =>
                  handleInputChange("translateLanguage", e.target.value)
                }
                className="w-full p-2 border rounded-lg"
              >
                <option value="">No languages selected</option>
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>
          </div>
        );

      case "Learning Preferences":
        return (
          <div className="space-y-6">
            <PreferenceField
              title="Communication"
              value={formData.communication}
              onChange={(e) =>
                handleInputChange("communication", e.target.value)
              }
              options={["Text Chat", "Voice Messages", "Video Calls"]}
            />
            <PreferenceField
              title="Time Commitment"
              value={formData.timeCommitment}
              onChange={(e) =>
                handleInputChange("timeCommitment", e.target.value)
              }
              options={["1-2 hours/week", "3-5 hours/week", "5+ hours/week"]}
            />
            <PreferenceField
              title="Learning Schedule"
              value={formData.learningSchedule}
              onChange={(e) =>
                handleInputChange("learningSchedule", e.target.value)
              }
              options={["Morning", "Afternoon", "Evening", "Flexible"]}
            />
            <PreferenceField
              title="Correction Preference"
              value={formData.correctionPreference}
              onChange={(e) =>
                handleInputChange("correctionPreference", e.target.value)
              }
              options={[
                "Correct me immediately",
                "Correct me after conversation",
                "Only when asked",
              ]}
            />
          </div>
        );

      case "Topics":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Topics</h3>
              <div className="flex items-center gap-2">
                <input
                  value={formData.newTopic}
                  onChange={(e) =>
                    handleInputChange("newTopic", e.target.value)
                  }
                  className="border rounded-lg px-3 py-1 w-48"
                  placeholder="New topic"
                />
                <button
                  onClick={handleAddTopic}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="border-t pt-4">
              {formData.topics.map((topic) => (
                <div
                  key={topic}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <span className="text-gray-700">{topic}</span>
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="text-red-500 hover:text-red-700 text-xl"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "Following":
        return (
          <div className="space-y-6">
            <div className="flex border-b">
              {["Following", "Followers", "Blocked"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleInputChange("followingTab", tab)}
                  className={`px-6 py-3 font-medium ${
                    formData.followingTab === tab
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500 hover:text-blue-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="py-6">
              {formData.followingTab === "Following" &&
                renderFollowList(following)}
              {formData.followingTab === "Followers" &&
                renderFollowList(followers)}
              {formData.followingTab === "Blocked" && renderFollowList(blocked)}
            </div>
          </div>
        );

      case "Settings":
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Privacy</h3>
              <ToggleSection
                label="Show my location"
                checked={formData.showLocation}
                onChange={() =>
                  handleInputChange("showLocation", !formData.showLocation)
                }
              />
              <ToggleSection
                label="Show my Tandem ID"
                checked={formData.showTandemID}
                onChange={() =>
                  handleInputChange("showTandemID", !formData.showTandemID)
                }
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <ToggleSection
                label="Receive notifications for messages or calls"
                checked={formData.notifications}
                onChange={() =>
                  handleInputChange("notifications", !formData.notifications)
                }
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Download your data</h3>
              <p className="text-gray-500 mb-2">
                You can download your Tandem personal data here.
              </p>
              <a
                href="mailto:enlighten@gmail.com?subject=Request for Tandem personal data"
                className="inline-block bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Request data
              </a>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-500">
                Account Actions
              </h3>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleMenuItemClick("Log out")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full"
                >
                  Log Out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 w-full"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Delete Account Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-xl font-semibold mb-4">Delete Account</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete your account? This action
                    cannot be undone and will permanently delete all your data.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      disabled={isLoading}
                    >
                      {isLoading ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "Visitors":
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              You had 1 new visitor to your profile last week. Upgrade to Tandem
              Pro to connect with them.
            </p>
            <button
              onClick={() => router.push("/subscription")}
              className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600"
            >
              SEE YOUR VISITORS
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Please upload an image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setSaveError("Image size should be less than 5MB");
      return;
    }

    try {
      setIsLoading(true);
      setSaveError(null);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      // Note: Don't set Content-Type header, let the browser set it with the boundary
      const response = await fetch(
        "http://localhost:8080/api/profile/upload-picture",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await response.json();

      // Update the form data with the new image URL
      setFormData((prev) => ({
        ...prev,
        profilePicture: data.imageUrl,
      }));

      setSuccessMessage("Profile picture updated successfully!");

      // Refresh profile data
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.error("Profile picture upload error:", error);
      setSaveError(error.message || "Failed to upload profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - (formData.photos?.length || 0);

    if (files.length > remainingSlots) {
      setSaveError(
        `You can only upload ${remainingSlots} more photo${
          remainingSlots === 1 ? "" : "s"
        }`
      );
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setSaveError("Please upload only image files");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setSaveError("Each image size should be less than 5MB");
        return;
      }
    }

    try {
      setIsLoading(true);
      setSaveError(null);
      const uploadData = new FormData();
      files.forEach((file) => {
        uploadData.append("photos", file);
      });

      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:8080/api/profile/upload-photos",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photos");
      }

      const data = await response.json();

      // Update the form data with the new photos
      setFormData((prev) => ({
        ...prev,
        photos: data.photos,
      }));

      setSuccessMessage("Photos uploaded successfully!");

      // Refresh profile data
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.error("Photos upload error:", error);
      setSaveError(error.message || "Failed to upload photos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async (photoIndex) => {
    try {
      setIsLoading(true);
      setSaveError(null);

      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please log in again.");
      }

      const response = await fetch(
        `http://localhost:8080/api/profile/photos/${photoIndex}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete photo");
      }

      const data = await response.json();

      // Update the form data with the updated photos array
      setFormData((prev) => ({
        ...prev,
        photos: data.photos,
      }));

      setSuccessMessage("Photo deleted successfully!");

      // Refresh profile data
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.error("Photo deletion error:", error);
      setSaveError(error.message || "Failed to delete photo");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFollowList = (users) => {
    if (!Array.isArray(users) || users.length === 0) {
      return <div className="text-gray-500">No users to display</div>;
    }

    return (
      <div className="space-y-4">
        {users.map((user) => {
          if (!user) return null;

          // Get profile picture URL, checking if it's a full URL or a relative path
          const profilePicture = user.profilePicture
            ? user.profilePicture.startsWith("http")
              ? user.profilePicture
              : `http://localhost:8080${user.profilePicture}`
            : defaultAvatar;

          return (
            <div
              key={user.userId || user._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={profilePicture}
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = defaultAvatar;
                  }}
                />
                <div>
                  <h3 className="font-medium">
                    {user.name || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{user.tandemID || "unknown"}
                  </p>
                </div>
              </div>
              {formData.followingTab === "Blocked" ? (
                <button
                  onClick={() => handleUnblock(user.userId)}
                  disabled={unblockLoading[user.userId]}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  {unblockLoading[user.userId] ? "Loading..." : "Unblock"}
                </button>
              ) : (
                <button
                  onClick={() =>
                    router.push(`/community/${user.userId || user._id}`)
                  }
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Profile
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Main Layout */}
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 md:border-r border-gray-200">
              <div className="p-4">
                <nav className="flex md:flex-col overflow-x-auto md:overflow-visible space-x-4 md:space-x-0 md:space-y-2">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleMenuItemClick(item.label)}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${activeTab === item.label 
                          ? "bg-blue-50 text-blue-700" 
                          : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 w-full">
                  <h1 className="text-2xl font-semibold">Edit Profile</h1>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="ml-auto bg-green-500 text-white px-4 sm:px-6 py-2 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Status Messages */}
              {status === "loading" && (
                <div className="mb-4 text-center">
                  <p className="text-gray-600">Loading...</p>
                </div>
              )}
              {status === "failed" && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                  {typeof error === "object" ? JSON.stringify(error) : error}
                </div>
              )}

              {/* Tab Content */}
              <div className="space-y-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      required={required}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-y"
    />
  </div>
);

const LanguageFormSection = ({ title, value, onChange }) => (
  <div className="mb-6">
    <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
    <select
      value={value || ""}
      onChange={onChange}
      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    >
      <option value="">Select a language</option>
      <option value="English">English (English)</option>
      <option value="French">French (Français)</option>
      <option value="Chinese">Chinese (Traditional) (中文 (繁體))</option>
    </select>
  </div>
);

const PreferenceField = ({ title, value, onChange, options }) => (
  <div className="mb-6">
    <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    >
      <option value="Not set">Not set</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const ToggleSection = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-sm text-gray-700">{label}</span>
    <div
      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
      onClick={onChange}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
          checked ? "translate-x-6" : ""
        }`}
      />
    </div>
  </div>
);

export default ProfileForm;
