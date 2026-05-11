const key = (username: string) => `obrared_ofertas_enviadas_${username}`;

export const getOfertasEnviadas = (username: string): string[] => {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(key(username));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const marcarOfertaEnviada = (username: string, solicitudId: string) => {
  if (!username) return;
  const actuales = getOfertasEnviadas(username);
  if (actuales.includes(solicitudId)) return;
  localStorage.setItem(key(username), JSON.stringify([...actuales, solicitudId]));
};
