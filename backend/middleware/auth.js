import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized, login again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // ✅ store in req.userId
    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export default authUser;
