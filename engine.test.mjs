// Session role - simulates "who is logged in" for this demo. One role for
// the whole app (set at the top), so a person is a patient OR a guardian OR
// a social worker, never several at once.
import { createContext, useContext, useState, createElement } from "react";
const RoleCtx = createContext({ role: "patient", setRole: () => {} });
export function RoleProvider({ children }) {
  const [role, setRole] = useState("patient");
  return createElement(RoleCtx.Provider, { value: { role, setRole } }, children);
}
export function useRole() { return useContext(RoleCtx); }
