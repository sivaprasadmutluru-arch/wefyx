export function sessionDestination(role, returnTo) {
  if (role === "CUSTOMER") {
    return returnTo && /^\/(account|cart|shop|rent|services|book-support|my-tickets)(\/|\?|$)/.test(returnTo) && !returnTo.includes("\\") ? returnTo : "/account";
  }
  return ["EMPLOYEE", "VENDOR"].includes(role) ? "/admin/portal" : "/admin/login";
}
