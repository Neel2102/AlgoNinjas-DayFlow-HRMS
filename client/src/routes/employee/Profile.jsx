import React, { useEffect, useMemo, useState } from "react";

import Button from "../../components/common/Button";
import * as employeeService from "../../services/employeeService";
import "../../CSS/Profile.css";

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
};

const Profile = () => {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("private");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  const profilePicStorageKey = (u) => {
    const id = u?.id || u?._id || u?.user?.id || u?.user?._id || "";
    const email = u?.email || u?.user?.email || "";
    const key = String(id || email || "").trim();
    return key ? `profile_picture_url:${key}` : "profile_picture_url";
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await employeeService.getMyProfile();
        if (!mounted) return;
        setMe(res);

        setFullName(res?.personal?.fullName || "");
        setPhone(res?.personal?.phone || "");
        setAddress(res?.personal?.address || "");
        setProfilePictureUrl(res?.personal?.profilePictureUrl || "");
        const url = String(res?.personal?.profilePictureUrl || "");
        localStorage.setItem(profilePicStorageKey(res?.user), url);
        window.dispatchEvent(new Event("profile_picture_updated"));
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const canSave = useMemo(() => {
    if (saving || loading) return false;
    return true;
  }, [saving, loading]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await employeeService.updateMyProfile({
        fullName,
        phone,
        address,
        profilePictureUrl,
      });
      setMe(updated);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name || "");
    setError("");
    setSuccess("");

    try {
      setUploading(true);
      const dataUrl = await fileToDataUrl(file);
      const updated = await employeeService.uploadMyProfilePicture({ dataUrl });
      setMe(updated);
      const url = String(updated?.personal?.profilePictureUrl || "");
      setProfilePictureUrl(url);
      localStorage.setItem(profilePicStorageKey(updated?.user), url);
      window.dispatchEvent(new Event("profile_picture_updated"));
      setSuccess("Profile picture updated");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const getInitials = () => {
    const name = fullName || me?.user?.email || "U";
    return String(name).slice(0, 1).toUpperCase();
  };

  return (
    <div className="container-profile">
      {/* Header */}
      <div className="header-profile">
        <div className="header-left-profile">
          <h1 className="title-profile">My Profile</h1>
          <div className="subtitle-profile">Manage your personal information</div>
        </div>

        {/* Tab Controls */}
        <div className="tabs-profile">
          <button
            className={`btn-profile ${activeTab === "private" ? "btn-primary-profile" : "btn-ghost-profile"}`}
            onClick={() => setActiveTab("private")}
          >
            Private Info
          </button>
          <button
            className={`btn-profile ${activeTab === "security" ? "btn-primary-profile" : "btn-ghost-profile"}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error ? (
        <div className="message-card-profile error-message-profile">
          <div className="message-text-profile">{error}</div>
        </div>
      ) : null}

      {/* Success Message */}
      {success ? (
        <div className="message-card-profile success-message-profile">
          <div className="message-text-profile">{success}</div>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="loading-card-profile">
          <div className="loading-text-profile">Loading profile...</div>
        </div>
      ) : (
        <>
          {/* Profile Header Card */}
          <div className="profile-header-card-profile">
            <div className="profile-info-profile">
              <div className="profile-avatar-profile">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="profile" />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div className="profile-details-profile">
                <div className="profile-name-profile">
                  {me?.personal?.fullName || me?.user?.email}
                </div>
                <div className="profile-meta-profile">
                  {me?.user?.employeeId || "No ID"} • {me?.user?.role || "Employee"}
                </div>
                <div className={`profile-status-profile ${me?.user?.isEmailVerified ? "verified-profile" : ""}`}>
                  Email {me?.user?.isEmailVerified ? "Verified" : "Not Verified"}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          {activeTab === "security" ? (
            <div className="content-card-profile">
              <div className="section-title-profile">Security Settings</div>
              <div className="divider-profile" />
              <div className="security-info-profile">
                Password reset and change functionality can be added in the next phase. 
                OTP email verification is already implemented for enhanced security. 
                Two-factor authentication (2FA) and session management features are planned for future updates.
              </div>
            </div>
          ) : (
            <div className="content-card-profile">
              <div className="section-title-profile">Private Information</div>
              <div className="divider-profile" />

              <form className="form-profile" onSubmit={save}>
                <div className="form-grid-profile">
                  {/* Full Name */}
                  <div className="form-row-profile">
                    <label className="form-label-profile">Full Name</label>
                    <input
                      className="form-input-profile"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div className="ui-small ui-muted">Profile picture</div>
                    <div className="ui-row gap-10" style={{ flexWrap: "wrap" }}>
                      <input
                        className="ui-input"
                        type="file"
                        accept="image/*"
                        onChange={onPickImage}
                        disabled={uploading || saving}
                        style={{ width: 320 }}
                      />
                      <Button variant="ghost" type="button" disabled>
                        {selectedFileName ? selectedFileName : uploading ? "Uploading..." : "Choose image"}
                      </Button>
                    </div>
                    <div className="ui-small ui-muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                      Uploads to Cloudinary and updates your profile picture everywhere.
                    </div>
                  </div>

                  {/* Profile Picture URL */}
                  <div className="form-row-profile">
                    <label className="form-label-profile">Profile Picture URL</label>
                    <input
                      className="form-input-profile"
                      value={profilePictureUrl}
                      onChange={(e) => setProfilePictureUrl(e.target.value)}
                      placeholder="https://example.com/profile.jpg"
                    />
                  </div>

                  {/* Phone and Email Row */}
                  <div className="form-row-double-profile">
                    <div className="form-row-profile">
                      <label className="form-label-profile">Phone Number</label>
                      <input
                        className="form-input-profile"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="form-row-profile">
                      <label className="form-label-profile">Email Address</label>
                      <input
                        className="form-input-profile"
                        value={me?.user?.email || ""}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-row-profile">
                    <label className="form-label-profile">Address</label>
                    <input
                      className="form-input-profile"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, City, Country"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions-profile">
                  <button
                    className="btn-profile btn-primary-profile"
                    type="submit"
                    disabled={!canSave}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;