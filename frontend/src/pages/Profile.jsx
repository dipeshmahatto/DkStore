import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ phone: "", address: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/user/profile",
          {
            headers: { token: localStorage.getItem("token") },
          }
        );
        if (data.success) {
          setProfile(data.profile);
          setFormData({
            phone: data.profile.phone || "",
            address: data.profile.address || "",
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(
        "http://localhost:4000/api/user/profile",
        formData,
        { headers: { token: localStorage.getItem("token") } }
      );

      if (data.success) {
        toast.success("Profile updated!");
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
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  if (!profile) return <p className="text-center mt-12">Loading...</p>;

  return (
    <div className="text-center mt-12">
      {/* Black circular placeholder */}
      <div className="rounded-full w-36 h-36 mx-auto bg-black"></div>

      {!editing ? (
        <>
          <h2 className="text-2xl mt-4">{profile.name}</h2>
          <p className="text-gray-600">{profile.phone || "No phone added"}</p>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-600">{profile.address || "No address added"}</p>

          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Edit Profile
          </button>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-4 flex flex-col items-center gap-3"
        >
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="border rounded px-3 py-2 w-64"
          />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            className="border rounded px-3 py-2 w-64"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
