export const PASSWORD_HINT = "Mindst 10 tegn, med både bogstav og tal.";

export function passwordError(password: string): string | null {
  if (password.length < 10) return "Adgangskoden skal være mindst 10 tegn.";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    return "Adgangskoden skal indeholde både bogstav og tal.";
  }
  return null;
}
