import { create } from 'zustand'

interface AgendamientoState {
  paso: number
  setPaso: (paso: number) => void
  servicioId: string | null
  setServicioId: (id: string) => void
  repuestoIds: string[]
  setRepuestoIds: (ids: string[]) => void
  cliente: {
    nombre: string
    email: string
    telefono: string
  }
  setCliente: (cliente: AgendamientoState['cliente']) => void
  direccion: string
  setDireccion: (d: string) => void
  ciudadId: string | null
  setCiudadId: (id: string) => void
  fechaHora: string | null
  setFechaHora: (fh: string) => void
  reset: () => void
}

const initial = {
  paso: 0,
  servicioId: null,
  repuestoIds: [],
  cliente: { nombre: '', email: '', telefono: '' },
  direccion: '',
  ciudadId: null,
  fechaHora: null,
}

export const useAgendamientoStore = create<AgendamientoState>((set) => ({
  ...initial,
  setPaso: (paso) => set({ paso }),
  setServicioId: (id) => set({ servicioId: id }),
  setRepuestoIds: (ids) => set({ repuestoIds: ids }),
  setCliente: (cliente) => set({ cliente }),
  setDireccion: (d) => set({ direccion: d }),
  setCiudadId: (id) => set({ ciudadId: id }),
  setFechaHora: (fh) => set({ fechaHora: fh }),
  reset: () => set(initial),
}))
