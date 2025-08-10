import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/user/profile",
          {
            headers: {
              token: localStorage.getItem("token"), // matches backend
            },
          }
        );
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="text-center mt-12">
      {/* Black circular placeholder */}
      <div className="rounded-full w-36 h-36 mx-auto bg-black"></div>

      <h2 className="text-2xl mt-4">{profile?.name || "Loading..."}</h2>
      <p className="text-gray-600">{profile?.phone || "+91 XXXXX XXXXX"}</p>
      <p className="text-gray-600">{profile?.email || "example@email.com"}</p>
      
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Edit Profile
      </button>
    </div>
  );
};

export default Profile;
