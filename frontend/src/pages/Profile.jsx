import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Profile = () => {
  const { backendUrl, token } = useContext(ShopContext);

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/profile`, {
          headers: { token },
        });
        if (data.success) {
          setProfile(data.profile);
          setFormData({
            phone: data.profile.phone || "",
            address: data.profile.address || "",
          });
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      }
    };
    if (token) fetchProfile();
  }, [token, backendUrl]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/user/profile`,
        formData,
        { headers: { token } }
      );

      if (data.success) {
        toast.success("Profile updated");
        setProfile((prev) => ({
          ...prev,
          phone: formData.phone,
          address: formData.address,
        }));
        setEditing(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <p className="text-center mt-12 text-gray-400 text-sm">Loading...</p>;
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="border-t pt-16 pb-16">
      <div className="text-2xl mb-8">
        <Title text1={"MY"} text2={"PROFILE"} />
      </div>

      <div className="max-w-md mx-auto border rounded-sm p-8">
        {/* Avatar with initials */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-medium">
            {initial}
          </div>
          <h2 className="text-lg font-medium mt-3">{profile.name}</h2>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>

        {!editing ? (
          <>
            <div className="flex flex-col gap-3 text-sm border-t pt-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-800">
                  {profile.phone || "Not added"}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-gray-500 shrink-0">Address</span>
                <span className="text-gray-800 text-right">
                  {profile.address || "Not added"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-6 w-full py-2.5 bg-black text-white text-sm rounded-sm hover:bg-gray-800 transition"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="border-t pt-5">
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs text-gray-500">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="border rounded-sm px-3 py-2 text-sm w-full"
              />
            </div>
            <div className="flex flex-col gap-1 mb-5">
              <label className="text-xs text-gray-500">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Delivery address"
                rows={3}
                className="border rounded-sm px-3 py-2 text-sm w-full resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-black text-white text-sm rounded-sm hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 border text-sm rounded-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;