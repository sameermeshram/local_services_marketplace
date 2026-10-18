import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout, { MobileBottomNav } from "../layouts/AppLayout";
import MaterialIcon from "../components/ui/MaterialIcon";
import { providerService } from "../services/api";

export default function EditProviderProfilePage() {
  const navigate = useNavigate();
  const [previewSrc, setPreviewSrc] = useState("");
  const [pincodes, setPincodes] = useState([]);
  const [experience, setExperience] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadKey, setProfileLoadKey] = useState(0);
  const [serviceAreaInput, setServiceAreaInput] = useState("");
  const [serviceAreaError, setServiceAreaError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(null);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setError("");

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
      })
      .finally(() => { if (active) setProfileLoading(false); });

    return () => {
      active = false;
    };
  }, [profileLoadKey]);

  const handleDocumentUpload = async (file) => {
    if (!file || uploadingDocument) return;
    const formData = new FormData();
    formData.append("document", file);
    setUploadingDocument(true);
    setError("");
    setMessage("");

    try {
      const response =
        await providerService.uploadVerificationDocument(formData);
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
          : prev,
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
    if (!file || uploadingPhoto) return;

    const formData = new FormData();
    formData.append("photo", file);
    setUploadingPhoto(true);
    setError("");
    try {
      const response = await providerService.uploadPhoto(formData);
      if (response.data?.profileImage) {
        setPreviewSrc(response.data.profileImage);
        setProfile((current) => current ? { ...current, profileImage: response.data.profileImage } : current);
      }
      setMessage("Profile photo uploaded.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to upload profile photo.",
      );
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleDocumentDelete = async (index) => {
    if (
      deletingDocument !== null ||
      !window.confirm("Delete this verification document?")
    )
      return;

    setDeletingDocument(index);
    setError("");
    setMessage("");
    try {
      const response = await providerService.deleteVerificationDocument(index);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              verificationDocuments: response.data?.verificationDocuments || [],
            }
          : prev,
      );
      setMessage("Verification document deleted.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete verification document.",
      );
    } finally {
      setDeletingDocument(null);
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

  const addPincode = () => {
    const pin = serviceAreaInput.trim();
    if (!/^\d{5,6}$/.test(pin)) {
      setServiceAreaError("Enter a valid 5 or 6 digit postal code.");
      return;
    }
    if (pincodes.includes(pin)) {
      setServiceAreaError("This service area is already listed.");
      return;
    }
    setPincodes((current) => [...current, pin]);
    setServiceAreaInput("");
    setServiceAreaError("");
  };

  const discardChanges = () => {
    formRef.current?.reset();
    setExperience(profile?.yearsExperience ?? 0);
    setPincodes((profile?.serviceAreas ?? []).map((area) => area.pincode).filter(Boolean));
    setServiceAreaInput("");
    setServiceAreaError("");
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await providerService.updateProfile({
        bio: formData.get("bio"),
        serviceType: formData.get("serviceType"),
        pricePerVisit: Number(formData.get("pricePerVisit")),
        yearsExperience: experience,
        serviceAreas: pincodes,
        serviceName: formData.get("serviceName"),
        serviceDescription: formData.get("serviceDescription"),
        servicePrice: Number(formData.get("servicePrice")),
      });
      if (response.data?.profile) {
        setProfile((current) => ({
          ...current,
          ...response.data.profile,
          user: response.data.user || current?.user,
          categories: current?.categories,
        }));
      }
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
      role="provider"
      mobileNav={<MobileBottomNav activeItem="profile" role="provider" />}
      mainClassName="min-w-0 lg:ml-[250px]"
      topBar={
        <header className="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between border-b border-border-subtle bg-surface-container-lowest/95 px-4 backdrop-blur-md sm:px-6 lg:ml-[250px] lg:w-[calc(100%_-_250px)] lg:px-8">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm text-primary">
              Edit Provider Profile
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="relative group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <MaterialIcon
                name="notifications"
                className="text-on-surface-variant cursor-pointer group-hover:text-primary transition-colors"
              />
            </button>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Provider profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <MaterialIcon name="person" className="text-on-surface-variant" />
              )}
            </div>
          </div>
        </header>
      }
    >
      <div className="mx-auto max-w-5xl space-y-gutter p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            disabled={saving || profileLoading || !profile}
            className="flex min-h-11 items-center gap-2 self-start rounded-lg bg-primary px-6 py-3 font-bold text-on-primary shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
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

        {profileLoading && <div className="space-y-4" role="status" aria-label="Loading provider profile"><div className="h-32 animate-pulse rounded-xl bg-surface-container-high" /><div className="h-80 animate-pulse rounded-xl bg-surface-container-high" /></div>}
        {!profileLoading && !profile && error && <button type="button" onClick={() => setProfileLoadKey((key) => key + 1)} className="min-h-11 rounded-lg border border-outline-variant px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Try again</button>}

        {!profileLoading && profile && <form
          ref={formRef}
          key={`${profile?._id || "provider-profile"}-${profile?.updatedAt || "initial"}`}
          className="grid grid-cols-12 gap-gutter"
          id="provider-profile-form"
          onSubmit={handleSubmit}
        >
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-surface-container">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Provider profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MaterialIcon
                    name="person"
                    className="text-6xl text-on-surface-variant"
                  />
                )}
              </div>
              <label
                htmlFor="photo-upload"
                aria-label="Upload provider profile photo"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (["Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    photoInputRef.current?.click();
                  }
                }}
                className="absolute bottom-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-md transition-colors hover:bg-primary-container focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              >
                <MaterialIcon name="photo_camera" />
                <input
                  ref={photoInputRef}
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingPhoto}
                  onClick={(event) => event.stopPropagation()}
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {uploadingPhoto ? "Uploading photo..." : "Upload Business Photo"}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Add a clear business photo so customers can recognize your
              service profile.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm bento-card space-y-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-4">
              General Information
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="provider-bio" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  id="provider-bio"
                  defaultValue={profile?.bio || ""}
                  maxLength={2000}
                  className="w-full bg-surface border border-outline-variant rounded-lg p-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[160px]"
                  placeholder="Tell clients about your expertise, your approach to work, and why they should choose you..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="provider-service-type" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Service Category
                  </label>
                  <select
                    name="serviceType"
                    id="provider-service-type"
                    defaultValue={(["electrician", "electrical_repairs"].includes(profile?.user?.serviceType || profile?.categories?.[0]?.slug) ? "electrical" : profile?.user?.serviceType || profile?.categories?.[0]?.slug || "")}
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    <option value="" disabled>
                      Select a service category
                    </option>
                    <option value="electrical">Electrical Repairs</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="hvac">Heating and Cooling</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="provider-price-per-visit" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Price Per Visit (Min)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      name="pricePerVisit"
                      id="provider-price-per-visit"
                      min="0"
                      step="0.01"
                      defaultValue={profile?.pricePerVisit ?? 0}
                      className="w-full bg-surface border border-outline-variant rounded-lg p-3 pl-8 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="provider-service-name" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Primary Service
                  </label>
                  <input
                    name="serviceName"
                    id="provider-service-name"
                    maxLength={120}
                    defaultValue={profile?.services?.[0]?.name || ""}
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="provider-service-price" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                    Service Price
                  </label>
                  <input
                    type="number"
                    name="servicePrice"
                    id="provider-service-price"
                    min="0"
                    step="0.01"
                    defaultValue={profile?.services?.[0]?.price ?? 0}
                    className="w-full bg-surface border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="provider-service-description" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Service Description
                </label>
                <textarea
                  name="serviceDescription"
                  id="provider-service-description"
                  defaultValue={profile?.services?.[0]?.description || ""}
                  maxLength={500}
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
                <label htmlFor="provider-experience" className="block font-label-md text-label-md text-on-surface-variant mb-1 ml-1">
                  Years of Experience
                </label>
                <input
                  type="range"
                  id="provider-experience"
                  min="0"
                  max="80"
                  value={experience}
                  aria-valuetext={`${experience} years`}
                  aria-describedby="provider-experience-value"
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-on-surface-variant font-body-sm">
                  <span>New Professional</span>
                  <span id="provider-experience-value" className="text-primary font-bold" aria-live="polite">
                    {experience} Years Experience
                  </span>
                  <span>Expert (80)</span>
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
                      <button type="button" aria-label={`Remove service area ${pin}`} onClick={() => removePincode(pin)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <MaterialIcon name="close" className="text-[14px]" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="text" inputMode="numeric" pattern="[0-9]{5,6}" maxLength={6} value={serviceAreaInput} onChange={(event) => { setServiceAreaInput(event.target.value.replace(/\D/g, "")); setServiceAreaError(""); }} aria-label="New service area postal code" aria-describedby={serviceAreaError ? "service-area-error" : undefined} placeholder="Add a 5 or 6 digit postal code" className="min-h-11 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={addPincode} className="min-h-11 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Add area</button>
                </div>
                {serviceAreaError && <p id="service-area-error" className="mt-2 text-sm text-error" role="alert">{serviceAreaError}</p>}
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
            {profile?.approvalStatus === "rejected" && (
              <div
                className="space-y-2 rounded-lg border border-error/30 bg-error/5 p-4"
                role="alert"
              >
                <p className="font-label-md font-bold text-error">
                  Verification rejected
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {profile.approvalReason?.trim()
                    ? `Reason: ${profile.approvalReason}`
                    : "No specific rejection reason was provided."}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Upload a new verification document to submit your profile for review again.
                </p>
              </div>
            )}
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload verification document"
              aria-disabled={uploadingDocument}
              onClick={() =>
                !uploadingDocument && fileInputRef.current?.click()
              }
              onKeyDown={(e) =>
                ["Enter", " "].includes(e.key) &&
                !uploadingDocument &&
                (e.preventDefault(), fileInputRef.current?.click())
              }
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all group ${
                uploadingDocument
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary/5 hover:border-primary cursor-pointer"
              }`}
            >
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-container/20 group-hover:text-primary transition-colors">
                <MaterialIcon
                  name={uploadingDocument ? "sync" : "upload_file"}
                  className={`text-3xl ${uploadingDocument ? "animate-spin" : ""}`}
                />
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface mb-1">
                {uploadingDocument
                  ? "Uploading Document..."
                  : "ID or Business License"}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Drag &amp; drop PDF or Image (JPEG, PNG, WEBP, max 5MB) here, or
                click to browse.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={uploadingDocument}
                onClick={(event) => event.stopPropagation()}
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleDocumentUpload(selected);
                  e.target.value = "";
                }}
              />
            </div>
            {profile?.verificationDocuments &&
              profile.verificationDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    Uploaded Documents ({profile.verificationDocuments.length}
                    /5):
                  </p>
                  <div className="space-y-2">
                    {profile.verificationDocuments.map((document, idx) => (
                      <div
                        key={document.id || idx}
                        className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded-lg text-body-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MaterialIcon
                            name="description"
                            className="text-primary text-xl flex-shrink-0"
                          />
                          <span className="truncate font-mono text-xs">
                            Verification Document {idx + 1}
                          </span>
                        </div>
                        <a
                          href={providerService.getVerificationDocumentUrl(idx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
                        >
                          View{" "}
                          <MaterialIcon
                            name="open_in_new"
                            className="text-sm"
                          />
                        </a>
                        <button
                          type="button"
                          disabled={deletingDocument === idx}
                          onClick={() => handleDocumentDelete(idx)}
                          className="text-error hover:underline font-bold text-xs disabled:opacity-50"
                        >
                          {deletingDocument === idx ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            <div className="flex items-start gap-3 p-4 bg-surface-container rounded-lg border border-outline-variant">
              <MaterialIcon name="info" className="text-primary-container" />
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                Your documents are stored privately and only used for identity
                verification by our security team.
              </p>
            </div>
          </div>

          <div className="col-span-12 flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant pt-8">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={discardChanges}
                disabled={saving}
                className="min-h-11 rounded-lg border border-outline px-6 py-3 font-bold text-on-surface transition-all hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 rounded-lg bg-secondary-container px-8 py-3 font-bold text-on-secondary-container shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>}
      </div>
    </AppLayout>
  );
}
