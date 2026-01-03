import React, { useEffect, useMemo, useState } from "react";

import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import * as employeeService from "../../services/employeeService";

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
      setSuccess("Profile updated");
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

  return (
    <div>
      <div className="ui-row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="ui-h1">My Profile</h1>
          <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
            Manage your personal information
          </div>
        </div>

        <div className="ui-row gap-8" style={{ flexWrap: "wrap" }}>
          <Button variant={activeTab === "private" ? "primary" : "ghost"} onClick={() => setActiveTab("private")}>Private Info</Button>
          <Button variant={activeTab === "security" ? "primary" : "ghost"} onClick={() => setActiveTab("security")}>Security</Button>
        </div>
      </div>

      {error ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{error}</div>
        </Card>
      ) : null}

      {success ? (
        <Card className="pad" style={{ marginBottom: 12 }}>
          <div className="ui-small">{success}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="pad">
          <div className="ui-small ui-muted">Loading...</div>
        </Card>
      ) : (
        <div className="ui-grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
          <Card className="pad" style={{ padding: 18 }}>
            <div className="ui-row between" style={{ flexWrap: "wrap", gap: 12 }}>
              <div className="ui-row gap-12">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    border: "1px solid var(--border-medium)",
                    background: "var(--bg-primary)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 1000,
                    overflow: "hidden",
                  }}
                >
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{String(fullName || me?.user?.email || "U").slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 1000, fontSize: 16 }}>{me?.personal?.fullName || me?.user?.email}</div>
                  <div className="ui-small ui-muted" style={{ marginTop: 4 }}>
                    {me?.user?.employeeId || ""} • {me?.user?.role || ""}
                  </div>
                  <div className="ui-small ui-muted" style={{ marginTop: 2 }}>
                    Email Verified: {me?.user?.isEmailVerified ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {activeTab === "security" ? (
            <Card className="pad" style={{ padding: 18 }}>
              <div className="ui-title">Security</div>
              <div className="ui-divider" style={{ margin: "10px 0" }} />
              <div className="ui-small ui-muted" style={{ lineHeight: 1.6 }}>
                Password reset/change can be added next. OTP email verification is implemented.
              </div>
            </Card>
          ) : (
            <Card className="pad" style={{ padding: 18 }}>
              <div className="ui-title">Private Info</div>
              <div className="ui-divider" style={{ margin: "10px 0" }} />

              <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div className="ui-small ui-muted">Full name</div>
                    <input className="ui-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div className="ui-small ui-muted">Phone</div>
                      <input className="ui-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div className="ui-small ui-muted">Email</div>
                      <input className="ui-input" value={me?.user?.email || ""} disabled />
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div className="ui-small ui-muted">Address</div>
                    <input className="ui-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>

                <div className="ui-row" style={{ justifyContent: "flex-end" }}>
                  <Button variant="primary" type="submit" disabled={!canSave}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
