import React from "react";
import { assets } from "../assets/assets";

const Profile = () => {
  return (
    <>
      <div className="text-center mt-12">
        <img
          src={assets.logo}
          alt="Profile"
          className="rounded-full w-36 h-36 mx-auto"
        />
        <h2 className="text-2xl mt-4">John Doe</h2>
        <p className="text-gray-600">+1 234 567 890</p>
        <p className="text-gray-600">johndoe@example.com</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Edit Profile</button>
      </div>
    </>
  );
};

export default Profile;
