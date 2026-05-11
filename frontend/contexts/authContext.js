import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);

  const login = (id, username) => {
    setIsAuthenticated(true);
    setUserId(Number(id));
    setUserName(username);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
