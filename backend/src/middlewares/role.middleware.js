import ApiError from "../utils/ApiError.js";

// GENERAL ROLE CHECK
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Access denied");
    }
    next();
  };
};

// SHORTCUTS
const onlyCandidate = authorizeRoles("candidate");
const onlyCompany = authorizeRoles("company");

export{
    authorizeRoles,
    onlyCandidate,
    onlyCompany
}