export function getUserDisplayName(email: string) {
  const [username] = email.split("@");

  return username || "there";
}
