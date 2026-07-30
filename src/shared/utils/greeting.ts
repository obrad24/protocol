export function greetingForHour(hour: number, displayName: string): string {
  const name = displayName.trim() || 'tamo';
  if (hour < 12) return `Dobro jutro, ${name}`;
  if (hour < 18) return `Dobar dan, ${name}`;
  return `Dobro veče, ${name}`;
}

export function greetingNow(displayName: string): string {
  return greetingForHour(new Date().getHours(), displayName);
}
