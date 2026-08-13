import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SetupUsername = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/register", { replace: true }); }, [navigate]);
  return null;
};

export default SetupUsername;
