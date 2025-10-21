export function canWriteToFirestore(role) {
  return role === "admin";
}