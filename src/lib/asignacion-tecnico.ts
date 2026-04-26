export async function asignarTecnico(
  _ciudadId: string,
  _fechaHora: string
): Promise<{ tecnicoId: string | null; esEmergencia: boolean }> {
  return { tecnicoId: null, esEmergencia: true }
}