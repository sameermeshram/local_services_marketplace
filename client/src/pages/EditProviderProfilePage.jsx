import { useEffect, useState, useRef } from "react";
import AppLayout from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import { editProfileAvatar, editProfilePreview } from "../data/mockData";
import { providerService } from "../services/api";

const INITIAL_PINCODES = ["90001", "90012", "90210"];

export default function EditProviderProfilePage() {
  const [previewSrc, setPreviewSrc] = useState(editProfilePreview);
  const [pincodes, setPincodes] = useState(INITIAL_PINCODES);
  const [experience, setExperience] = useState(8);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    providerService
      .getProfile()
      .then((response) => {
        if (!active) return;
        const nextProfile = response.data?.profile;
        if (!nextProfile) return;

        setProfile(nextProfile);
        setExperience(nextProfile.yearsExperience ?? 0);
        setPincodes(
          (nextProfile.serviceAreas ?? [])
            .map((area) => area.pincode)
            .filter(Boolean),
        );
        if (nextProfile.profileImage) setPreviewSrc(nextProfile.profileImage);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load provider profile.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDocumentUpload = async (file) => {
    if (!file || uploadingDocument) return;
    const formData = new FormData();
    formData.append("document", file);
    setUploadingDocument(true);
    setError("");
    setMessage("");

    try {
      const response = await providerService.uploadVerificationDocument(formData);
      const updatedDocs = response.data?.verificationDocuments;
      const nextStatus = response.data?.approvalStatus || "pending";

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              verificationDocuments: updatedDocs || prev.verificationDocuments,
              approvalStatus: nextStatus,
              isApproved: nextStatus === "approved",
            }
          : prev
      );
      setMessage("Verification document uploaded and submitted for review.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to upload verification document.",
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("photo", file);
    setUploadingPhoto(true);
    setError("");
    try {
      const response = await providerService.uploadPhoto(formData);
      if (response.data?.profileImage)
        setPreviewSrc(response.data.profileImage);
      setMessage("Profile photo uploaded.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to upload profile photo.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleDocumentUpload(file);
  };

  const removePincode = (pin) => {
    setPincodes((prev) => prev.filter((p) => p !== pin));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await providerService.updateProfile({
        bio: formData.get("bio"),
        serviceType: formData.get("serviceType"),
        pricePerVisit: Number(formData.get("pricePerVisit")),
        yearsExperience: experience,
        serviceAreas: pincodes,
        serviceName: formData.get("serviceName"),
        serviceDescription: formData.get("serviceDescription"),
        servicePrice: Number(formData.get("servicePrice")),
      });
      setMessage("Profile changes saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save profile changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      activeItem="profile"
      mainClassName="md:ml-[280px] min-h-screen"
      topBar={
        <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-desktop h-16">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              Edit Provider Profile
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <MaterialIcon
                name="notifications"
                className="text-on-surface-variant cursor-pointer group-hover:text-primary transition-colors"
              />
              <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full" />
            </div>
            <MaterialIcon
              name="help"
              className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
            />
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container">
              <img
                src={editProfileAvatar}
                alt="Provider headshot"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>
      }
    >
      <div className="p-margin-desktop max-w-5xl mx-auto space-y-gutter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Service Provider Settings
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Update your details to attract more local clients and maintain
              your professional reputation.
            </p>
          </div>
          <button
            type="submit"
            form="provider-profile-form"
            disabled={saving}
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <MaterialIcon name="save" />
            Save All Changes
          </button>
        </div>
        {message && (
          <p className="text-primary text-body-sm" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="text-error text-body-sm" role="alert">
            {error}
          </p>
        )}

        <form
          key={profile?._id || "provider-profile-form"}
          className="grid grid-cols-12 gap-gutter"
          id="provider-profile-form"
          onSubmit={handleSubmit}
        >
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 bg-surface-container">
                <img
                  src={previewSrc}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-1 right-1 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-container transition-colors"
              >
                <MaterialIcon name="photo_camera" />
                <input
                  ref={photoInputRef}
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {uploadingPhoto ? "Uploading photo..." : "Upload Business Photo"}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Professional photos increase bookings by 40%.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card space-y-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-4">
              General Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  defaultValue={profile?.bio || ""}
                  className="w-full bg-surface border border-outline-variant rounded-lg p-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[160px]"
                  placeholder="Tell clients about your expertise, your approach to work, and why they should choose you..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Service Category
                  </label>
                  <select
                    name="serviceType"
                    defaultValue={
                      profile?.categories?.[0]?.slug || "electrician"
                    }
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="electrician">Electrical Repairs</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painter">Painting</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Price Per Visit (Min)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      name="pricePerVisit"
                      defaultValue={profile?.pricePerVisit ?? 0}
                      className="w-full bg-surface border border-outline-variant rounded-lg p-3 pl-8 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Primary Service
                  </label>
                  <input
                    name="serviceName"
                    defaultValue={profile?.services?.[0]?.name || ""}
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Service Price
                  </label>
                  <input
                    type="number"
                    name="servicePrice"
                    defaultValue={profile?.services?.[0]?.price ?? 0}
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Service Description
                </label>
                <textarea
                  name="serviceDescription"
                  defaultValue={profile?.services?.[0]?.description || ""}
                  rows={3}
                  placeholder="Describe what is included in this service."
                  className="w-full bg-surface border border-outline-variant rounded-lg p-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card space-y-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-4">
              Expertise &amp; Reach
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Years of Experience
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-on-surface-variant font-body-sm">
                  <span>New Professional</span>
                  <span className="text-primary font-bold">
                    {experience} Years Experience
                  </span>
                  <span>Expert (30+)</span>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-3 ml-1">
                  Service Areas (Pincodes)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {pincodes.map((pin) => (
                    <span
                      key={pin}
                      className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-full flex items-center gap-1 font-label-md border border-primary/20"
                    >
                      {pin}
                      <button type="button" onClick={() => removePincode(pin)}>
                        <MaterialIcon name="close" className="text-[14px]" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="border border-dashed border-outline text-on-surface-variant px-3 py-1 rounded-full font-label-md hover:bg-surface-container-high transition-colors"
                  >
                    + Add New
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Verification
              </h3>
              {profile?.approvalStatus === "approved" || profile?.isApproved ? (
                <span className="bg-success/10 text-success px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Verified
                </span>
              ) : profile?.approvalStatus === "pending" ? (
                <span className="bg-warning/10 text-warning px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Pending Approval
                </span>
              ) : profile?.approvalStatus === "rejected" ? (
                <span className="bg-error/10 text-error px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Rejected
                </span>
              ) : (
                <span className="bg-error/10 text-error px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Unverified
                </span>
              )}
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploadingDocument && fileInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && !uploadingDocument && fileInputRef.current?.click()
              }
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group ${
                uploadingDocument ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/5 hover:border-primary cursor-pointer"
              }`}
            >
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-container/20 group-hover:text-primary transition-colors">
                <MaterialIcon name={uploadingDocument ? "sync" : "upload_file"} className={`text-3xl ${uploadingDocument ? "animate-spin" : ""}`} />
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface mb-1">
                {uploadingDocument ? "Uploading Document..." : "ID or Business License"}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Drag &amp; drop PDF or Image (JPEG, PNG, WEBP, max 5MB) here, or click to browse.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={uploadingDocument}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleDocumentUpload(selected);
                }}
              />
            </div>
            {profile?.verificationDocuments && profile.verificationDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Uploaded Documents ({profile.verificationDocuments.length}/5):
                </p>
                <div className="space-y-2">
                  {profile.verificationDocuments.map((docUrl, idx) => (
                    <div
                      key={docUrl || idx}
                      className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded-lg text-body-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MaterialIcon name="description" className="text-primary text-xl flex-shrink-0" />
                        <span className="truncate font-mono text-xs">
                          Verification Document {idx + 1}
                        </span>
                      </div>
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
                      >
                        View <MaterialIcon name="open_in_new" className="text-sm" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 bg-surface-container rounded-lg border border-outline-variant">
              <MaterialIcon name="info" className="text-primary-container" />
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                Your documents are encrypted and only used for identity
                verification by our security team.
              </p>
            </div>
          </div>

          <div className="col-span-12 pt-8 flex items-center justify-between border-t border-outline-variant">
            <button
              type="button"
              className="text-error font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-error/5 transition-colors"
            >
              <MaterialIcon name="delete_forever" />
              Deactivate Account
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                className="border border-outline text-on-surface font-bold px-8 py-3 rounded-lg hover:bg-surface-container-high transition-all"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-secondary-container text-on-secondary-container font-bold px-12 py-3 rounded-lg shadow-lg hover:shadow-xl active:scale-[0.95] transition-all"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
